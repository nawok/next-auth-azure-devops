if (!(Test-Path -Path $env:ChocolateyInstall\lib\mkcert)) {
  choco install mkcert -y
}
mkcert -install
mkcert localhost
