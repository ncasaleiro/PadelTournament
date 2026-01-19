# Build Windows Executable

This guide generates a Windows `.exe` for the backoffice server using `pkg`.

## Prerequisites

- Node.js 18+
- npm

## Build

From the `backoffice` folder:

```bash
npm install
npm run build:win
```

The executable will be created at:

```
backoffice/dist/padel-backoffice.exe
```

## Run on Windows

1. Copy the `dist/padel-backoffice.exe` to a folder on the Windows machine.
2. Create a `data` folder next to the `.exe`.
3. Run the executable by double-click or via cmd:

```bat
padel-backoffice.exe
```

The server will start at:

```
http://localhost:3000
```

## Notes

- The executable reads/writes data to the `data` folder next to the `.exe`.
- Static frontend files are bundled inside the executable.
