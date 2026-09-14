# Run with: pwsh -File test/release-archive.test.ps1
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $ProjectRoot 'release.ps1'), [ref]$null, [ref]$null)
$ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] }, $false) | ForEach-Object { Invoke-Expression $_.Extent.Text }
$fixture = Join-Path ([IO.Path]::GetTempPath()) ('morelord-release-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $fixture 'packs/example') -Force | Out-Null
$ProjectRoot = $fixture
$manifest = @{id='test-module';title='Test';version='1.0.0';compatibility=@{minimum='13';verified='13'};download='https://example.com/test.zip';manifest='https://example.com/module.json'}
$manifest | ConvertTo-Json | Set-Content (Join-Path $fixture 'module.json')
'// runtime' | Set-Content (Join-Path $fixture 'main.js')
'live database data' | Set-Content (Join-Path $fixture 'packs/example/000123.log')
$zip = "$fixture.zip"
Build-Archive -SourceDirectory $fixture -DestinationArchive $zip
$params = @{Path=$zip;ExpectedVersion='1.0.0';ExpectedDownloadUrl=$manifest.download;ExpectedModuleId='test-module';RequiredPaths=@('module.json','main.js','packs')}
Assert-Archive @params
'diagnostic' | Set-Content (Join-Path $fixture 'debug.log')
Build-Archive -SourceDirectory $fixture -DestinationArchive $zip
$rejected = $false
try { Assert-Archive @params } catch { if ($_.Exception.Message -notmatch 'Forbidden archive entry') { throw }; $rejected=$true }
if (!$rejected) { throw 'Ordinary logs must remain forbidden.' }
Write-Output 'PASS: required runtime files and LevelDB logs accepted; diagnostic logs rejected.'
