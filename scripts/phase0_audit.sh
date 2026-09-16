#!/usr/bin/env bash
# ==============================================================================
# Script Verifikasi Fase 0: Audit Lingkungan WSL2 & Sumber Daya
# ==============================================================================
set -euo pipefail

echo "=========================================================="
echo "  [BMKG CKAN] Memulai Verifikasi Gerbang Kelulusan Fase 0"
echo "=========================================================="

# 1. Audit OS Release
echo -n "[1/4] Memeriksa Distribusi OS: "
OS_DISTRO=$(lsb_release -is 2>/dev/null || cat /etc/os-release | grep ^ID= | cut -d= -f2)
OS_VERSION=$(lsb_release -rs 2>/dev/null || cat /etc/os-release | grep ^VERSION_ID= | cut -d= -f2 | tr -d '"')

if [[ "$OS_DISTRO" == "Ubuntu" && "$OS_VERSION" == "22.04" ]]; then
    echo "OK ($OS_DISTRO $OS_VERSION)"
else
    echo "GAGAL! Dibutuhkan Ubuntu 22.04 LTS (Terdeteksi: $OS_DISTRO $OS_VERSION)"
    exit 1
fi

# 2. Audit Arsitektur CPU
echo -n "[2/4] Memeriksa Arsitektur CPU: "
ARCH=$(uname -m)
if [[ "$ARCH" == "x86_64" ]]; then
    echo "OK ($ARCH)"
else
    echo "GAGAL! Dibutuhkan arsitektur x86_64 (Terdeteksi: $ARCH)"
    exit 1
fi

# 3. Audit Systemd
echo -n "[3/4] Memeriksa Status Systemd: "
if systemctl is-system-running --quiet 2>/dev/null || [[ "$(ps -p 1 -o comm=)" == "systemd" ]]; then
    echo "OK (Systemd Aktif)"
else
    echo "PERINGATAN! Systemd belum aktif di WSL2. Pastikan /etc/wsl.conf memiliki [boot] systemd=true"
fi

# 4. Audit Storage
echo -n "[4/4] Memeriksa Kapasitas Disk (/): "
FREE_DISK_GB=$(df -BG / | awk 'NR==2 {print $4}' | tr -d 'G')
if [[ "$FREE_DISK_GB" -ge 20 ]]; then
    echo "OK ($FREE_DISK_GB GB tersedia)"
else
    echo "PERINGATAN! Sisa ruang disk $FREE_DISK_GB GB < 20 GB yang direkomendasikan."
fi

echo "=========================================================="
echo "  Gerbang Kelulusan Fase 0: LULUS AUDIT DASAR"
echo "=========================================================="
