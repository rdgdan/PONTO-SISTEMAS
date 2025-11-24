# Source folder

This `source/` folder is intended as a convenience copy of the main application files.

How to create/update it

From the repository root (PowerShell):

```powershell
.\scripts\make_source.ps1
```

Notes
- This folder is a copy — modifying files inside `source/` will not change the original project unless you copy changes back.
- The script copies common items: `app`, `lib`, `context`, `components`, `public`, and key config files (if present).
