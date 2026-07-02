$payload1 = @{
    tipoContratto = "wedding"
    lingua = "it"
    preventivo = "TEST-001"
    prezzo = "1500,00"
    datiCliente = @{
        nome = "Mario"
        cognome = "Rossi"
        luogo_di_nascita = "Napoli"
        data_di_nascita = "1980-01-01"
        residenza = "Roma"
        nazione = "Italia"
        indirizzo = "Via Roma"
        numero_civico = "1"
        cap = "00100"
        email = "mario@rossi.it"
        telefono = "1234567890"
        codice_fiscale = "RSSMRA80A01H501A"
        data_evento = "2026-10-20"
        accetto = $true
        comunicazione_terzi = "SI"
        marketing = "SI"
        sposera_nome = "Luigi"
        sposera_cognome = "Verdi"
    }
    firma_disegnata = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    firma_disegnata_clausole = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
} | ConvertTo-Json -Depth 5 -Compress

$payload2 = @{
    tipoContratto = "wedding"
    lingua = "en"
    preventivo = "TEST-001"
    prezzo = "1500,00"
    datiCliente = @{
        nome = "John"
        cognome = "Doe"
        luogo_di_nascita = "London"
        data_di_nascita = "1980-01-01"
        residenza = "London"
        nazione = "UK"
        indirizzo = "Baker St"
        numero_civico = "221B"
        cap = "NW1 6XE"
        email = "john@doe.co.uk"
        telefono = "1234567890"
        codice_fiscale = "JOHNDOE123456789"
        data_evento = "2026-10-20"
        accetto = $true
        comunicazione_terzi = "NO"
        marketing = "NO"
        sposera_nome = "Jane"
        sposera_cognome = "Smith"
    }
    firma_disegnata = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    firma_disegnata_clausole = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
} | ConvertTo-Json -Depth 5 -Compress

$payload3 = @{
    tipoContratto = "eventi"
    lingua = "it"
    preventivo = "TEST-002"
    prezzo = "1000,00"
    datiCliente = @{
        nome = "Giuseppe"
        cognome = "Bianchi"
        luogo_di_nascita = "Milano"
        data_di_nascita = "1990-05-15"
        residenza = "Milano"
        nazione = "Italia"
        indirizzo = "Via Dante"
        numero_civico = "10"
        cap = "20100"
        email = "giuseppe@bianchi.it"
        telefono = "0987654321"
        codice_fiscale = "BNCGPP90E15F205Z"
        giorno_ed_ora_evento = "2026-12-01T19:00"
        tipo_evento = "Diciottesimo"
        accetto = $true
        comunicazione_terzi = "SI"
        marketing = "NO"
    }
    firma_disegnata = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    firma_disegnata_clausole = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
} | ConvertTo-Json -Depth 5 -Compress

$payload4 = @{
    tipoContratto = "eventi"
    lingua = "en"
    preventivo = "TEST-002"
    prezzo = "1000,00"
    datiCliente = @{
        nome = "Mary"
        cognome = "Poppins"
        luogo_di_nascita = "London"
        data_di_nascita = "1990-05-15"
        residenza = "London"
        nazione = "UK"
        indirizzo = "Cherry Tree Lane"
        numero_civico = "17"
        cap = "W1"
        email = "mary@poppins.co.uk"
        telefono = "0987654321"
        codice_fiscale = "MRYPPN90E15LNDON"
        giorno_ed_ora_evento = "2026-12-01T19:00"
        tipo_evento = "Corporate Party"
        accetto = $true
        comunicazione_terzi = "NO"
        marketing = "NO"
    }
    firma_disegnata = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
    firma_disegnata_clausole = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII="
} | ConvertTo-Json -Depth 5 -Compress

$headers = @{
    "Content-Type" = "application/json"
}

function Test-Endpoint {
    param([string]$Name, [string]$Payload)
    Write-Host "Testing $Name..."
    try {
        $response = Invoke-RestMethod -Uri "http://localhost:3000/api/generate-pdf" -Method Post -Headers $headers -Body $Payload -ErrorAction Stop
        Write-Host "✅ [$Name] Success! URL: $($response.url)"
    } catch {
        Write-Host "❌ [$Name] Error: $($_.Exception.Message)"
        if ($_.ErrorDetails) {
            Write-Host "Details: $($_.ErrorDetails.Message)"
        }
    }
    Write-Host "---------------------------------"
}

Test-Endpoint -Name "Wedding (IT)" -Payload $payload1
Test-Endpoint -Name "Wedding (EN)" -Payload $payload2
Test-Endpoint -Name "Eventi (IT)" -Payload $payload3
Test-Endpoint -Name "Eventi (EN)" -Payload $payload4
