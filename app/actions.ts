'use server';

import { cookies } from 'next/headers';
import { db, auth } from '@/lib/firebaseAdmin';
import { revalidatePath } from 'next/cache';
import { getTimezoneOffset } from 'date-fns-tz';
import type { PontoEntry } from '@/lib/types';

// --- FUNÇÕES DE SESSÃO E DATA ---
async function getSessionUser() {
  const sessionCookie = cookies().get('__session')?.value;
  if (!sessionCookie) throw new Error('Sessão não encontrada. Acesso negado.');
  try {
    const decodedToken = await auth.verifySessionCookie(sessionCookie, true);
    return { uid: decodedToken.uid, isAdmin: decodedToken.admin === true };
  } catch (error) {
    throw new Error('Sessão inválida ou expirada.');
  }
}

const createUtcDate = (dateStr: string, timeStr: string, timeZone: string): Date => {
    const [year, month, day] = dateStr.split('-').map(Number);
    const [hour, minute] = timeStr.split(':').map(Number);
    const naiveDate = new Date(Date.UTC(year, month - 1, day, hour, minute));
    const timezoneOffset = getTimezoneOffset(timeZone, naiveDate);
    return new Date(naiveDate.getTime() - timezoneOffset);
};

// --- LÓGICA DE CÁLCULO DE HORAS ---
function minutesToCentesimal(totalMinutes: number): number {
    const sign = totalMinutes < 0 ? -1 : 1;
    const absMinutes = Math.abs(totalMinutes);
    const hours = Math.floor(absMinutes / 60);
    const minutes = absMinutes % 60;
    const centesimal = hours + minutes / 100;
    return parseFloat((centesimal * sign).toFixed(2));
}

function calculateHours(checkIn: Date, checkOut: Date, isHoliday: boolean) {
    const dayOfWeek = checkIn.getUTCDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    let checkOutDate = new Date(checkOut.getTime());

    if (isHoliday || isWeekend) {
        checkOutDate.setUTCMinutes(0, 0, 0);
    }

    let totalMinutesWorked = (checkOutDate.getTime() - checkIn.getTime()) / (1000 * 60);
    if (totalMinutesWorked < 0) totalMinutesWorked = 0;
    
    const lunchMinutes = totalMinutesWorked > 240 ? 60 : 0;
    const netMinutesWorked = totalMinutesWorked - lunchMinutes;

    let normalMinutes = 0;
    let extraMinutes = 0;
    let bankMinutes = 0;

    if (isHoliday || isWeekend) {
        extraMinutes = netMinutesWorked;
    } else {
        const standardWorkMinutes = 480;
        const diff = netMinutesWorked - standardWorkMinutes;
        if (diff < 0) {
            normalMinutes = netMinutesWorked > 0 ? netMinutesWorked : 0;
            bankMinutes = diff;
        } else {
            normalMinutes = standardWorkMinutes;
            const extraCreditHours = Math.floor(diff / 60);
            if (extraCreditHours > 0) {
                extraMinutes = extraCreditHours * 60;
            }
        }
    }
    
    return {
        totalHours: minutesToCentesimal(totalMinutesWorked),
        lunchHours: minutesToCentesimal(lunchMinutes),
        normalHours: minutesToCentesimal(normalMinutes),
        overtimeHours: minutesToCentesimal(extraMinutes),
        bancoDeHoras: minutesToCentesimal(bankMinutes),
    };
}

// --- AÇÕES DE PONTO ---
export async function logPonto(formData: FormData) {
    try {
        const user = await getSessionUser();
        const rawData = {
            date: formData.get('date') as string, 
            startTime: formData.get('startTime') as string,
            endTime: formData.get('endTime') as string,
            isHoliday: formData.get('isHoliday') === 'true',
            pontoId: formData.get('pontoId') as string | null, 
            timeZone: formData.get('timeZone') as string,
        };

        const checkIn = createUtcDate(rawData.date, rawData.startTime, rawData.timeZone);
        const checkOut = createUtcDate(rawData.date, rawData.endTime, rawData.timeZone);

        if (checkIn >= checkOut) {
            return { success: false, message: 'Saída deve ser após a entrada.' };
        }

        const hours = calculateHours(checkIn, checkOut, rawData.isHoliday);
        const pontoData = { userId: user.uid, checkIn, checkOut, isHoliday: rawData.isHoliday, ...hours };

        let newEntryId = rawData.pontoId;

        if (rawData.pontoId) {
            await db.collection('pontos').doc(rawData.pontoId).update(pontoData);
            newEntryId = rawData.pontoId;
        } else {
            const docRef = await db.collection('pontos').add(pontoData);
            newEntryId = docRef.id;
        }
        
        revalidatePath('/dashboard');
        return { 
            success: true, 
            message: 'Registro salvo!', 
            newEntry: JSON.parse(JSON.stringify({ ...pontoData, id: newEntryId }))
        };
    } catch (error) {
        console.error("Erro em logPonto:", error);
        return { success: false, message: (error as Error).message };
    }
}

export async function getPontoHistory(): Promise<PontoEntry[]> {
  try {
    const user = await getSessionUser();
    const snapshot = await db.collection('pontos').where('userId', '==', user.uid).get();
    if (snapshot.empty) return [];
    
    const history = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        userId: data.userId,
        checkIn: data.checkIn.toDate(),
        checkOut: data.checkOut.toDate(),
        isHoliday: data.isHoliday || false,
        totalHours: data.totalHours || 0,
        lunchHours: data.lunchHours || 0,
        normalHours: data.normalHours || 0,
        overtimeHours: data.overtimeHours || 0,
        bancoDeHoras: data.bancoDeHoras || 0,
      } as PontoEntry;
    });

    history.sort((a, b) => b.checkIn.getTime() - a.checkIn.getTime());
    return history;
  } catch (error) {
    if ((error as Error).message.includes('Sessão')) return [];
    console.error("Erro ao buscar histórico:", error);
    throw error; 
  }
}

export async function deletePonto(pontoId: string) {
  try {
    const user = await getSessionUser();
    const pontoRef = db.collection('pontos').doc(pontoId);
    const doc = await pontoRef.get();
    if (!doc.exists || (!user.isAdmin && doc.data()?.userId !== user.uid)) {
        throw new Error('Permissão negada.');
    }
    await pontoRef.delete();
    revalidatePath('/dashboard');
    return { success: true, message: 'Registro excluído.' };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

// --- AÇÕES DE FERIADOS ---
export async function getNationalHolidays(year: number): Promise<{date: string, name: string}[]> {
    try {
        const response = await fetch(`https://brasilapi.com.br/api/feriados/v1/${year}`);
        if (!response.ok) return [];
        return await response.json();
    } catch (error) {
        console.error("Erro ao buscar feriados:", error);
        return [];
    }
}

// --- AÇÕES DE ADMIN ---
async function verifyAdminPrivileges() {
    const user = await getSessionUser();
    if (!user.isAdmin) throw new Error('Acesso negado. Apenas administradores.');
    return user.uid;
}

export async function updateUser(formData: FormData) {
  try {
    await verifyAdminPrivileges();
    const targetUserId = formData.get('uid') as string;
    const newName = formData.get('name') as string;
    const isAdmin = formData.get('isAdmin') === 'true';

    // **A CORREÇÃO DEFINITIVA**
    // Atualiza o nome de exibição no perfil de Autenticação
    await auth.updateUser(targetUserId, { displayName: newName });

    // Atualiza as permissões no perfil de Autenticação
    await auth.setCustomUserClaims(targetUserId, { admin: isAdmin });
    
    // Atualiza os dados no banco de dados Firestore (para consistência)
    await db.collection('users').doc(targetUserId).update({ name: newName, isAdmin });
    
    // Revalida os caminhos para garantir que a UI busque os novos dados
    revalidatePath('/admin');
    revalidatePath('/', 'layout');
    
    return { success: true, message: 'Usuário atualizado com sucesso!' };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function deleteUser(targetUserId: string) {
  try {
    const adminUserId = await verifyAdminPrivileges();
    if (adminUserId === targetUserId) throw new Error('Um administrador não pode excluir a si mesmo.');
    
    await auth.deleteUser(targetUserId);
    await db.collection('users').doc(targetUserId).delete();
    
    revalidatePath('/admin');
    revalidatePath('/', 'layout');
    return { success: true, message: 'Usuário excluído!' };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}

export async function resetUserPassword(email: string) {
  try {
    await verifyAdminPrivileges();
    const link = await auth.generatePasswordResetLink(email);
    console.log(`Link de redefinição para ${email}: ${link}`);
    return { success: true, message: `Link de redefinição enviado para o console.` };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
}
