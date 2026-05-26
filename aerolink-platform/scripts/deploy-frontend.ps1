# deploy-frontend.ps1
# Automates the provisioning, building, and deployment of the AeroLink React Frontend to AWS S3 + Route 53 Custom Domain.

$ErrorActionPreference = "Stop"

# Configuration
$domain = "aerolink.transnova.shop"
$rootDomain = "transnova.shop"
$region = "eu-west-1"

# Active AWS Load Balancer (Istio Ingress Gateway)
$albDnsName = "ac795954c452d408d96fc9a658169632-1093255538.eu-west-1.elb.amazonaws.com"
$albHostedZoneId = "Z32O12XQLNTSW2" # Canonical Hosted Zone ID for ALBs in eu-west-1
$s3HostedZoneId = "Z1BKCTXD74EZPE"  # Canonical Hosted Zone ID for S3 Web Hosting in eu-west-1

Write-Host "==========================================================" -ForegroundColor Cyan
Write-Host "       AeroLink Frontend AWS Deployment & Route 53         " -ForegroundColor Cyan
Write-Host "==========================================================" -ForegroundColor Cyan

# 1. Fetch Route 53 Hosted Zone ID for transnova.shop
Write-Host "[1/7] Resolving Hosted Zone ID for $rootDomain..." -ForegroundColor Yellow
$hostedZonesOutput = aws route53 list-hosted-zones | ConvertFrom-Json
$hostedZone = $hostedZonesOutput.HostedZones | Where-Object { $_.Name -eq "$rootDomain." } | Select-Object -First 1

if (-not $hostedZone) {
    Write-Error "Could not find a Route 53 Hosted Zone for '$rootDomain'."
}

$hostedZoneId = $hostedZone.Id
Write-Host "Found Hosted Zone: $hostedZoneId" -ForegroundColor Green

# 2. Create the S3 Website Bucket
Write-Host "[2/7] Creating S3 static website bucket: $domain..." -ForegroundColor Yellow
# Ignore error if bucket already exists
try {
    aws s3api create-bucket --bucket $domain --region $region --create-bucket-configuration LocationConstraint=$region
    Write-Host "S3 bucket created successfully." -ForegroundColor Green
} catch {
    Write-Host "S3 bucket already exists or was not recreated. Proceeding..." -ForegroundColor Gray
}

# 3. Disable Block Public Access for the S3 Bucket
Write-Host "[3/7] Disabling S3 Public Access Blocks for $domain..." -ForegroundColor Yellow
aws s3api put-public-access-block --bucket $domain --public-access-block-configuration "BlockPublicAcls=false,IgnorePublicAcls=false,BlockPublicPolicy=false,RestrictPublicBuckets=false"
Write-Host "Public Access Block disabled." -ForegroundColor Green

# 4. Enable Static Website Hosting on the S3 Bucket
Write-Host "[4/7] Configuring static website hosting for $domain..." -ForegroundColor Yellow
$websiteConfig = @{
    IndexDocument = @{ Suffix = "index.html" }
    ErrorDocument = @{ Key = "index.html" }
} | ConvertTo-Json -Compress

$websiteConfig | Out-File -FilePath "website-temp.json" -Encoding ascii
aws s3api put-bucket-website --bucket $domain --website-configuration file://website-temp.json
Remove-Item "website-temp.json"
Write-Host "Website hosting enabled (index & error docs set to index.html)." -ForegroundColor Green

# 5. Apply Public Read Bucket Policy
Write-Host "[5/7] Applying public read bucket policy..." -ForegroundColor Yellow
$policy = @{
    Version = "2012-10-17"
    Statement = @(
        @{
            Sid = "PublicReadGetObject"
            Effect = "Allow"
            Principal = "*"
            Action = "s3:GetObject"
            Resource = "arn:aws:s3:::$domain/*"
        }
    )
} | ConvertTo-Json -Depth 5

$policy | Out-File -FilePath "policy-temp.json" -Encoding ascii
aws s3api put-bucket-policy --bucket $domain --policy file://policy-temp.json
Remove-Item "policy-temp.json"
Write-Host "Public read bucket policy applied successfully." -ForegroundColor Green

# 6. Configure Route 53 DNS Records (Frontend and API)
Write-Host "[6/7] Updating Route 53 DNS records for subdomains..." -ForegroundColor Yellow
$dnsChanges = @{
    Comment = "Create frontend and API records for AeroLink"
    Changes = @(
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "$domain."
                Type = "A"
                AliasTarget = @{
                    HostedZoneId = $s3HostedZoneId
                    DNSName = "s3-website-eu-west-1.amazonaws.com."
                    EvaluateTargetHealth = $false
                }
            }
        },
        @{
            Action = "UPSERT"
            ResourceRecordSet = @{
                Name = "api.$domain."
                Type = "A"
                AliasTarget = @{
                    HostedZoneId = $albHostedZoneId
                    DNSName = "$albDnsName."
                    EvaluateTargetHealth = $true
                }
            }
        }
    )
} | ConvertTo-Json -Depth 5

$dnsChanges | Out-File -FilePath "dns-changes-temp.json" -Encoding ascii
aws route53 change-resource-record-sets --hosted-zone-id $hostedZoneId --change-batch file://dns-changes-temp.json
Remove-Item "dns-changes-temp.json"
Write-Host "Route 53 records Upserted:" -ForegroundColor Green
Write-Host " - $domain -> S3 Website Endpoint Alias" -ForegroundColor Green
Write-Host " - api.$domain -> Ingress LoadBalancer Alias" -ForegroundColor Green

# 7. Compile React Application and Synchronize to S3
Write-Host "[7/7] Compiling frontend React app for production..." -ForegroundColor Yellow

# Store current location and change to frontend directory
$parentDir = Get-Location
if (Test-Path "$parentDir\aerolink-platform\aerolink-web") {
    Set-Location "$parentDir\aerolink-platform\aerolink-web"
} elseif (Test-Path "$parentDir\aerolink-web") {
    Set-Location "$parentDir\aerolink-web"
} else {
    Write-Error "Could not find aerolink-web directory!"
}

# Set environment variables for Vite build process
$env:VITE_API_URL = "http://api.$domain"
$env:VITE_WS_URL = "ws://api.$domain" # Future-ready WebSocket endpoint mapped to gateway

try {
    # Build React application
    $buildOutput = npm run build
    Write-Host "React build completed successfully." -ForegroundColor Green
    
    # Synchronize built assets to the S3 bucket
    Write-Host "Synchronizing compiled assets to s3://$domain..." -ForegroundColor Yellow
    aws s3 sync dist/ "s3://$domain" --delete
    Write-Host "Assets synchronized successfully." -ForegroundColor Green
}
finally {
    # Restore original directory
    Set-Location $parentDir
}

Write-Host "`n==========================================================" -ForegroundColor Green
Write-Host "SUCCESS: AeroLink Airline Systems Platform is Live!" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
Write-Host "Frontend Custom URL : http://$domain" -ForegroundColor Green
Write-Host "Unified API Gateway : http://api.$domain" -ForegroundColor Green
Write-Host "==========================================================" -ForegroundColor Green
