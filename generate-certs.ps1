# Generate a private key
openssl genrsa -out key.pem 2048

# Create a configuration file for the certificate
@"
[req]
distinguished_name = req_distinguished_name
x509_extensions = v3_req
prompt = no

[req_distinguished_name]
C = US
ST = State
L = City
O = Organization
OU = Organizational Unit
CN = localhost

[v3_req]
keyUsage = keyEncipherment, dataEncipherment
extendedKeyUsage = serverAuth
subjectAltName = @alt_names

[alt_names]
DNS.1 = localhost
IP.1 = 127.0.0.1
"@ | Out-File -FilePath cert.conf -Encoding ASCII

# Generate a self-signed certificate
openssl req -new -x509 -key key.pem -out cert.pem -days 365 -config cert.conf

# Clean up
Remove-Item cert.conf

Write-Host "SSL certificates generated successfully!"
Write-Host "key.pem and cert.pem have been created in the current directory." 