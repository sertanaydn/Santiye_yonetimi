@echo off
echo "Şantiye Yöneticisi için Güvenlik Duvarı İzni Ayarlanıyor..."
netsh advfirewall firewall add rule name="NextJS App" dir=in action=allow protocol=TCP localport=3000
echo "Tamamlandı! Uygulama artık dışarıdan erişilebilir."
pause
