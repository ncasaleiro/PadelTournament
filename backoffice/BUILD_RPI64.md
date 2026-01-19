# Build Raspberry Pi OS 64-bit Executable

This guide generates a Linux ARM64 binary for Raspberry Pi OS 64-bit using `pkg`.

## Prerequisites

- Node.js 18+
- npm

## Build

From the `backoffice` folder:

```bash
npm install
npm run build:rpi64
```

The binary will be created at:

```
backoffice/dist/padel-backoffice-linux-arm64
```

## Run on Raspberry Pi OS 64-bit

1. Copy the binary to the Pi.
2. Create a `data` folder next to the binary.
3. Make it executable and run:

```bash
chmod +x padel-backoffice-linux-arm64
./padel-backoffice-linux-arm64
```

The server will start at:

```
http://<pi-ip>:3000
```

## Notes

- The binary reads/writes data to the `data` folder next to it.
- Static frontend files are bundled inside the binary.
