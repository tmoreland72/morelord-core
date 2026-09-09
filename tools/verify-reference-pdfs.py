"""Render every generated page, check text bounds, and create contact sheets for visual QA."""
from pathlib import Path
import argparse
import subprocess
import json
from concurrent.futures import ThreadPoolExecutor
import pdfplumber
from PIL import Image, ImageOps, ImageDraw

parser=argparse.ArgumentParser()
parser.add_argument('--pdftoppm',required=True)
parser.add_argument('--qa-dir',required=True)
parser.add_argument('--only',help='Verify one filename from the build manifest.')
args=parser.parse_args()
root=Path(__file__).resolve().parents[1]
out=root/'output/pdf'
qa=Path(args.qa_dir)
qa.mkdir(parents=True,exist_ok=True)
manifest=json.loads((out/'build-manifest.json').read_text())
if args.only:
    manifest=[item for item in manifest if item['file']==args.only]
    if not manifest: raise SystemExit('Requested PDF is not in the build manifest.')

def verify(item):
    file=out/item['file']
    issues=[]
    with pdfplumber.open(file) as doc:
        for i,p in enumerate(doc.pages,1):
            for c in p.chars:
                if c['x0']<45 or c['x1']>568 or c['top']<14 or c['bottom']>773:
                    issues.append([i,c['text'],round(c['x0'],1),round(c['x1'],1),round(c['top'],1)])
    prefix=qa/file.stem
    subprocess.run([args.pdftoppm,'-r','65','-png',str(file),str(prefix)],check=True,capture_output=True)
    pages=sorted(qa.glob(file.stem+'-*.png'))
    sheets=[]
    for start in range(0,len(pages),12):
        sheet=Image.new('RGB',(1440,1530),'#d8dee4')
        draw=ImageDraw.Draw(sheet)
        for j,page in enumerate(pages[start:start+12]):
            with Image.open(page) as pic:
                thumb=ImageOps.contain(pic,(345,460))
                x=(j%4)*360+7;y=(j//4)*510+26
                sheet.paste(thumb,(x,y))
                draw.text((x,y-18),f'{file.stem.replace("Morelord-","")} p{start+j+1}',fill='black')
        target=qa/(file.stem+f'-contact-{start//12+1:02d}.jpg')
        sheet.save(target,quality=88);sheets.append(str(target))
    return {'file':file.name,'pages':len(pages),'bounds_issues':issues[:30],'contact_sheets':sheets}

with ThreadPoolExecutor(max_workers=4) as pool: reports=list(pool.map(verify,manifest))
(qa/'qa-report.json').write_text(json.dumps(reports,indent=2))
print(json.dumps(reports,indent=2))
if any(x['bounds_issues'] for x in reports): raise SystemExit(1)
