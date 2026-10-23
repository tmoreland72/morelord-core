# Run with: pwsh -File test/release-archive.test.ps1
$ErrorActionPreference = 'Stop'
$ProjectRoot = Split-Path $PSScriptRoot -Parent
$ast = [System.Management.Automation.Language.Parser]::ParseFile((Join-Path $ProjectRoot 'release.ps1'), [ref]$null, [ref]$null)
$ast.FindAll({ param($n) $n -is [System.Management.Automation.Language.FunctionDefinitionAst] }, $false) | ForEach-Object { Invoke-Expression $_.Extent.Text }
$fixture = Join-Path (Join-Path $ProjectRoot 'tmp') ('morelord-release-test-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $fixture 'packs/example') -Force | Out-Null
$ProjectRoot = $fixture
$manifest = @{id='test-module';title='Test';version='1.0.0';compatibility=@{minimum='13';verified='13'};download='https://example.com/test.zip';manifest='https://example.com/module.json'}
$manifest | ConvertTo-Json | Set-Content (Join-Path $fixture 'module.json')
'// runtime' | Set-Content (Join-Path $fixture 'main.js')
'live database data' | Set-Content (Join-Path $fixture 'packs/example/000123.log')
$zip = "$fixture.zip"
Copy-ReleaseContent -Destination "$fixture-empty-optional" -RequiredPaths @('module.json', 'main.js', 'packs') -OptionalPaths @()
if (!(Test-Path -LiteralPath "$fixture-empty-optional/main.js")) { throw 'An empty optional-path list must still copy runtime files.' }
Build-Archive -SourceDirectory $fixture -DestinationArchive $zip
$params = @{Path=$zip;ExpectedVersion='1.0.0';ExpectedDownloadUrl=$manifest.download;ExpectedModuleId='test-module';RequiredPaths=@('module.json','main.js','packs')}
Assert-Archive @params
'diagnostic' | Set-Content (Join-Path $fixture 'debug.log')
Build-Archive -SourceDirectory $fixture -DestinationArchive $zip
$rejected = $false
try { Assert-Archive @params } catch { if ($_.Exception.Message -notmatch 'Forbidden archive entry') { throw }; $rejected=$true }
if (!$rejected) { throw 'Ordinary logs must remain forbidden.' }
Remove-Item -LiteralPath (Join-Path $fixture 'debug.log')
foreach ($folder in @('tmp', 'release-notes')) {
    New-Item -ItemType Directory -Path (Join-Path $fixture $folder) -Force | Out-Null
    'working file' | Set-Content (Join-Path $fixture "$folder/example.txt")
    Build-Archive -SourceDirectory $fixture -DestinationArchive $zip
    $rejected = $false
    try { Assert-Archive @params } catch { if ($_.Exception.Message -notmatch 'Forbidden archive entry') { throw }; $rejected = $true }
    if (!$rejected) { throw "$folder must remain forbidden." }
    Remove-Item -LiteralPath (Join-Path $fixture $folder) -Recurse
}
[System.IO.File]::WriteAllText((Join-Path $fixture 'CHANGELOG.md'), "# Sample Changelog`n")
Build-Archive -SourceDirectory $fixture -DestinationArchive $zip
$withChangelog = @{
    Path = $zip
    ExpectedVersion = '1.0.0'
    ExpectedDownloadUrl = $manifest.download
    ExpectedModuleId = 'test-module'
    RequiredPaths = @('module.json', 'main.js', 'packs', 'CHANGELOG.md')
}
Assert-Archive @withChangelog

$Utf8NoBom = New-Object System.Text.UTF8Encoding($false)
$changelogFixture = Join-Path (Split-Path $fixture -Parent) ('changelog-' + [guid]::NewGuid().ToString('N'))
New-Item -ItemType Directory -Path (Join-Path $changelogFixture 'release-notes') -Force | Out-Null
'{"id":"test-module","title":"Test Module","version":"1.10.0"}' | Set-Content (Join-Path $changelogFixture 'module.json')
@'
# Test Module 1.2.0

Intro should stay.

## Added

- First change

## Verification

- secret verification note

---

## Fixed

* Star bullet
'@ | Set-Content (Join-Path $changelogFixture 'release-notes/RELEASE-NOTES-1.2.0.md')
@'
# Test Module 1.9.0

## Validation

- internal validation note

## Changed

- Middle change
'@ | Set-Content (Join-Path $changelogFixture 'release-notes/RELEASE-NOTES-1.9.0.md')
@'
# Test Module 1.10.0

Summary before the standard section.

## What Changed

### Improvements

- Newer change

---

## Verification

Internal only.
'@ | Set-Content (Join-Path $changelogFixture 'release-notes/RELEASE-NOTES-1.10.0.md')
@'
# Unreleased

## What Changed

- Must not appear
'@ | Set-Content (Join-Path $changelogFixture 'release-notes/UNRELEASED.md')
'not a version' | Set-Content (Join-Path $changelogFixture 'release-notes/RELEASE-NOTES-draft.md')
$ProjectRoot = $changelogFixture
$first = Update-Changelog
if (-not $first.Changed) { throw 'The first changelog build must write CHANGELOG.md.' }
$changelogPath = Join-Path $changelogFixture 'CHANGELOG.md'
$changelog = [System.IO.File]::ReadAllText($changelogPath)
if ($changelog -notmatch '(?m)^# Test Module Changelog$') { throw 'Changelog title must come from module.json.' }
$order = @($changelog.IndexOf("## 1.10.0"), $changelog.IndexOf("## 1.9.0"), $changelog.IndexOf("## 1.2.0"))
if ($order[0] -lt 0 -or $order[1] -lt 0 -or $order[2] -lt 0 -or $order[0] -ge $order[1] -or $order[1] -ge $order[2]) {
    throw 'Changelog versions must be descending semantic versions.'
}
if ($changelog -match '(?m)^---\s*$') { throw 'Changelog must not contain horizontal rules.' }
if ($changelog -match 'secret verification note|internal validation note|Internal only|Must not appear|Summary before') {
    throw 'Changelog must omit verification, validation, and unreleased notes.'
}
if ($changelog -notmatch '(?m)^### Improvements\r?\n\r?\n- Newer change$') { throw 'What Changed subsections must be preserved.' }
if ($changelog -notmatch '(?m)^### Added\r?\n\r?\n- First change$') { throw 'Older change sections must be included.' }
if ($changelog -notmatch '(?m)^- Star bullet$') { throw 'Star bullets must be normalized to - bullets.' }
if ($changelog -notmatch '(?m)^Intro should stay\.$') { throw 'Older user-facing prose must be included.' }
$second = Update-Changelog
if ($second.Changed) { throw 'An up-to-date CHANGELOG.md must not be rewritten.' }
if ([System.IO.File]::ReadAllText($changelogPath) -ne $changelog) { throw 'The second changelog build changed file contents.' }
$beforeWhatIf = [System.IO.File]::ReadAllText($changelogPath)
@'
# Test Module 1.10.0

## What Changed

### Improvements

- Newer change
- Another change
'@ | Set-Content (Join-Path $changelogFixture 'release-notes/RELEASE-NOTES-1.10.0.md')
$preview = Update-Changelog -WhatIf
if (-not $preview.Changed) { throw 'WhatIf must report a stale changelog.' }
if ([System.IO.File]::ReadAllText($changelogPath) -ne $beforeWhatIf) { throw '-WhatIf must not dirty CHANGELOG.md.' }
Remove-Item -LiteralPath $changelogFixture -Recurse -Force
Write-Output 'PASS: runtime and LevelDB logs accepted; diagnostic logs, tmp, and release-notes rejected; CHANGELOG.md packaged and generated.'
