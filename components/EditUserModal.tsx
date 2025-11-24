'use client';

import { useState, useTransition, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createPortal } from 'react-dom';
import { User } from '@/app/admin/page';
import { updateUser, deleteUser, resetUserPassword } from '@/app/actions';

interface EditUserModalProps {
  user: User;
  disabled?: boolean;
}

const ConfirmationModal = ({ onConfirm, onCancel, message }: { onConfirm: () => void, onCancel: () => void, message: string }) => {
  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-80 z-[60] flex justify-center items-center p-4">
      <div className="bg-gray-900 rounded-lg shadow-2xl p-6 w-full max-w-sm text-white border border-red-500/50">
        <h4 className="text-lg font-bold text-red-400">Atenção</h4>
        <p className="text-gray-300 my-4">{message}</p>
        <div className="flex justify-end space-x-4 mt-6">
          <button onClick={onCancel} className="px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-500 font-semibold transition-colors">Cancelar</button>
          <button onClick={onConfirm} className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 font-bold transition-colors">Sim, continuar</button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default function EditUserModal({ user, disabled = false }: EditUserModalProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState(user.name || '');
  const [isAdmin, setIsAdmin] = useState(user.isAdmin);
  
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (user) {
        setName(user.name || '');
        setIsAdmin(user.isAdmin);
    }
  }, [user]);

  // Função de salvamento refeita para ser mais explícita
  const handleSaveChanges = () => {
    const formData = new FormData();
    formData.append('uid', user.uid);
    formData.append('name', name);
    formData.append('isAdmin', String(isAdmin));

    startTransition(async () => {
      const result = await updateUser(formData);
      setMessage({ type: result.success ? 'success' : 'error', text: result.message });
      if (result.success) {
        router.refresh();
        setTimeout(() => setMessage(null), 3000);
      }
    });
  };

  const handlePasswordReset = () => {
    startTransition(async () => {
        if (!user.email) {
            setMessage({ type: 'error', text: 'Usuário sem email para redefinir a senha.' });
            return;
        }
        const result = await resetUserPassword(user.email);
        setMessage({ type: result.success ? 'success' : 'error', text: result.message });
        setShowResetConfirm(false);
        setTimeout(() => setMessage(null), 5000);
    });
  };

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteUser(user.uid);
      if (result.success) {
        setMessage({ type: 'success', text: result.message });
        router.refresh();
        setTimeout(() => {
            setIsOpen(false);
            setShowDeleteConfirm(false);
        }, 2000);
      } else {
        setMessage({ type: 'error', text: result.message });
        setShowDeleteConfirm(false);
      }
    });
  };

  const ModalContent = (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50 flex justify-center items-center p-4">
      <div className="bg-gray-800 rounded-lg shadow-2xl p-6 w-full max-w-md text-white border border-gray-700">
        <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold">Gerenciar Usuário</h3>
            <button onClick={() => setIsOpen(false)} className="text-gray-400 hover:text-white">&times;</button>
        </div>
        {/* O formulário agora não tem a prop 'action' */}
        <form onSubmit={(e) => e.preventDefault()}> 
          <div className="space-y-4">
              <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Nome</label>
              <input value={name} onChange={(e) => setName(e.target.value)} className="w-full bg-gray-700/50 rounded-lg px-3 py-2" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-400 mb-1">Permissão</label>
              <select value={String(isAdmin)} onChange={(e) => setIsAdmin(e.target.value === 'true')} disabled={disabled} className="w-full bg-gray-700/50 rounded-lg px-3 py-2 disabled:opacity-50">
                <option value="false">Usuário</option>
                <option value="true">Administrador</option>
              </select>
            </div>
          </div>
          <div className="mt-6 flex justify-end">
            {/* O botão agora tem um onClick explícito */}
            <button type="button" onClick={handleSaveChanges} disabled={isPending} className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:bg-gray-500 font-bold transition-colors">
              {isPending ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
        {message && (
          <div className={`mt-4 p-3 rounded-lg text-center text-sm ${message.type === 'success' ? 'bg-green-500/20 text-green-300' : 'bg-red-500/20 text-red-300'}`}>
              {message.text}
          </div>
        )}
        <div className="mt-6 pt-6 border-t border-gray-700">
          <h4 className="text-md font-semibold text-red-400 mb-3">Ações de Risco</h4>
          <div className="flex justify-between items-center">
            <div>
                <p className="font-medium">Redefinir Senha</p>
                <p className="text-xs text-gray-400">Envia um email de redefinição para o usuário.</p>
            </div>
            <button onClick={() => setShowResetConfirm(true)} disabled={disabled || isPending} className="px-4 py-2 rounded-lg bg-yellow-600/80 hover:bg-yellow-700 text-sm font-semibold disabled:bg-gray-500 transition-colors">Enviar Email</button>
          </div>
          <div className="flex justify-between items-center mt-4">
            <div>
                <p className="font-medium">Excluir Usuário</p>
                <p className="text-xs text-gray-400">Remove o usuário permanentemente.</p>
            </div>
            <button onClick={() => setShowDeleteConfirm(true)} disabled={disabled || isPending} className="px-4 py-2 rounded-lg bg-red-600/80 hover:bg-red-700 text-sm font-semibold disabled:bg-gray-500 transition-colors">Excluir</button>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="font-medium text-blue-500 hover:text-blue-400 transition-colors">
        Gerenciar
      </button>

      {isMounted && isOpen && createPortal(ModalContent, document.body)}

      {isMounted && showResetConfirm && <ConfirmationModal onConfirm={handlePasswordReset} onCancel={() => setShowResetConfirm(false)} message={`Tem certeza que deseja enviar um email de redefinição de senha para ${user.email}?`} />}
      {isMounted && showDeleteConfirm && <ConfirmationModal onConfirm={handleDelete} onCancel={() => setShowDeleteConfirm(false)} message={'Esta ação é irreversível. O usuário e todos os seus dados (incluindo histórico de ponto) serão apagados. Tem certeza?'} />}
    </>
  );
}
