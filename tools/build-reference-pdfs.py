"""Render module source manuals in the shared Morelord document style.

Usage: python tools/build-reference-pdfs.py --node PATH --marked PATH
Requires ReportLab, Pillow, pypdf, and the marked Node package.
Brand and business docs are maintained in Google Drive, not in this repository.
"""
from pathlib import Path
import argparse
import html
import json
import re
import subprocess
import textwrap
from io import BytesIO
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image, KeepTogether
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.colors import HexColor, black, white
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from PIL import Image as PILImage
from pypdf import PdfReader

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'output/pdf'
OUT.mkdir(parents=True, exist_ok=True)
parser = argparse.ArgumentParser()
parser.add_argument('--node')
parser.add_argument('--marked')
parser.add_argument('--brand-only', action='store_true', help='Retired. Brand docs now live in Google Drive and are not built here.')
args = parser.parse_args()
if args.brand_only:
    raise SystemExit('Brand and business docs now live in Google Drive (Morelord Gaming) and are not built from this repository.')
if not args.node or not args.marked:
    parser.error('the following arguments are required: --node, --marked')
for name, file in [('Arial','arial.ttf'),('Arial-Bold','arialbd.ttf'),('Arial-Italic','ariali.ttf'),('Arial-BoldItalic','arialbi.ttf')]:
    pdfmetrics.registerFont(TTFont(name, str(Path('C:/Windows/Fonts')/file)))
pdfmetrics.registerFontFamily('Arial',normal='Arial',bold='Arial-Bold',italic='Arial-Italic',boldItalic='Arial-BoldItalic')
MUTED = HexColor('#4d6070')
BLUE = HexColor('#d2e3f1')
PALE = HexColor('#f2f6f9')
WIDTH = 504
styles = {
    'body': ParagraphStyle('body',fontName='Arial',fontSize=10.5,leading=13.8,spaceAfter=6,splitLongWords=True),
    'h1': ParagraphStyle('h1',fontName='Arial-Bold',fontSize=22,leading=27,spaceAfter=15,keepWithNext=True),
    'h2': ParagraphStyle('h2',fontName='Arial-Bold',fontSize=18,leading=22,spaceBefore=12,spaceAfter=8,keepWithNext=True),
    'h3': ParagraphStyle('h3',fontName='Arial-Bold',fontSize=12,leading=16,spaceBefore=7,spaceAfter=5,keepWithNext=True),
    'cell': ParagraphStyle('cell',fontName='Arial',fontSize=9.3,leading=12.2,spaceAfter=0,splitLongWords=True),
    'small': ParagraphStyle('small',fontName='Arial',fontSize=8.8,leading=11.5,spaceAfter=7,textColor=MUTED),
    'cover': ParagraphStyle('cover',fontName='Arial-Bold',fontSize=27,leading=32,spaceAfter=16),
    'subtitle': ParagraphStyle('subtitle',fontName='Arial',fontSize=17,leading=22,spaceAfter=16),
    'code': ParagraphStyle('code',fontName='Courier',fontSize=8,leading=10.5,spaceAfter=0),
    'htmlcode': ParagraphStyle('htmlcode',fontName='Courier',fontSize=9,leading=12,spaceAfter=0),
}

def clean(s):
    s=s.replace('\u2011','-').replace('\u2013','-').replace('\u2014',' - ').replace('\u2212','-')
    for a,b in {'□':'[Any]','☑':'[Include]','⊟':'[Exclude]','✅':'Yes','❌':'No','⚠':'Caution','→':' > '}.items(): s=s.replace(a,b)
    # Decorative emoji from Markdown headings are not part of the document typography.
    return ''.join(c for c in s if ord(c)<0x1f000 and c not in '\ufe0f\u200d')

def esc(s): return html.escape(clean(s),quote=False)

def inline(tokens):
    result=[]
    for t in tokens:
        typ=t['type']
        sub=lambda:inline(t.get('tokens',[])) if t.get('tokens') else esc(t.get('text',''))
        if typ=='strong': result.append('<b>'+sub()+'</b>')
        elif typ=='em': result.append('<i>'+sub()+'</i>')
        elif typ=='codespan': result.append('<font name="Courier" size="9">'+esc(t['text'])+'</font>')
        elif typ=='link':
            href=t.get('href','')
            result.append(('<link href="'+html.escape(href,quote=True)+'" color="#355b78">'+sub()+'</link>') if href.startswith(('https://','http://','mailto:')) else sub())
        elif typ=='br': result.append('<br/>')
        elif typ=='del': result.append('<strike>'+sub()+'</strike>')
        elif typ=='image': result.append(esc(t.get('text','')))
        elif typ=='html': result.append('<br/>' if t.get('text','').strip() in ('<br>','<br/>','<br />') else esc(re.sub('<[^>]+>','',t.get('text',''))))
        else: result.append(sub())
    return ''.join(result)

def lex(path):
    source=path.read_text(encoding='utf-8-sig')
    source=re.sub(r'^---\s*\n.*?\n---\s*\n','',source,flags=re.S)
    js="const fs=require('fs'); const {marked}=require(process.argv[1]); process.stdout.write(JSON.stringify(marked.lexer(fs.readFileSync(0,'utf8'))));"
    result=subprocess.run([args.node,'-e',js,args.marked],input=source,text=True,encoding='utf-8',capture_output=True,check=True)
    return json.loads(result.stdout)

def table(rows, widths=None):
    tab=Table(rows,colWidths=widths or [WIDTH/len(rows[0])]*len(rows[0]),repeatRows=1,hAlign='LEFT')
    tab.setStyle(TableStyle([
        ('BACKGROUND',(0,0),(-1,0),BLUE),('ROWBACKGROUNDS',(0,1),(-1,-1),[white,PALE]),
        ('LINEBELOW',(0,0),(-1,0),.5,HexColor('#87aaca')),
        ('VALIGN',(0,0),(-1,-1),'TOP'),('LEFTPADDING',(0,0),(-1,-1),7),('RIGHTPADDING',(0,0),(-1,-1),7),
        ('TOPPADDING',(0,0),(-1,-1),7),('BOTTOMPADDING',(0,0),(-1,-1),7)]))
    return tab

def para(text,style='body'):
    p=Paragraph(text,styles[style])
    if style=='body' and p.getPlainText().rstrip().endswith(':'): p.keepWithNext=True
    return p

warnings=[]

def render(tokens,path,depth=0):
    story=[]
    for t in tokens:
        typ=t['type']
        if typ=='space': continue
        if typ=='heading':
            story.append(para(inline(t['tokens']), 'h1' if t['depth']==1 else 'h2' if t['depth']==2 else 'h3'))
        elif typ in ('paragraph','text'):
            images=[x for x in t.get('tokens',[]) if x['type']=='image']
            if images:
                for im in images:
                    imgpath=path.parent / im['href']
                    if not imgpath.is_file(): raise ValueError(f'Missing image: {imgpath}')
                    with PILImage.open(imgpath) as pic: w,h=pic.size
                    factor=min(WIDTH/w,390/h,1)
                    figure=Image(str(imgpath),width=w*factor,height=h*factor,hAlign='LEFT')
                    figure.keepWithNext=True
                    figure.spaceAfter=5
                    story.extend([figure,para(esc(im.get('text','')),'small')])
                rest=[x for x in t['tokens'] if x['type']!='image']
                if inline(rest).strip(): story.append(para(inline(rest)))
            else: story.append(para(inline(t.get('tokens',[])) or esc(t.get('text',''))))
        elif typ=='list':
            for n,item in enumerate(t['items']):
                sub=render(item['tokens'],path,depth+1)
                if sub and isinstance(sub[0],Paragraph):
                    st=ParagraphStyle('list',parent=styles['body'],leftIndent=12+depth*10,firstLineIndent=-10,spaceAfter=4)
                    prefix=f"{int(t.get('start') or 1)+n}." if t.get('ordered') else '-'
                    sub[0]=Paragraph(esc(prefix)+' '+sub[0].text,st)
                story+=sub
        elif typ=='table':
            rows=[[para('<b>'+inline(c['tokens'])+'</b>','cell') for c in t['header']]]
            rows += [[para(inline(c['tokens']),'cell') for c in row] for row in t['rows']]
            n=len(rows[0]); widths=None
            if n==2: widths=[WIDTH*.35,WIDTH*.65]
            elif n==3: widths=[WIDTH*.26,WIDTH*.25,WIDTH*.49]
            story.extend([table(rows,widths),Spacer(1,9)])
        elif typ=='code':
            # Each code line is separately splittable; long URLs and commands wrap visibly.
            is_html=t.get('lang')=='html'
            code=[]
            for line in (t['text'] if is_html else clean(t['text'])).splitlines():
                code.extend(textwrap.wrap(line,width=88 if is_html else 98,expand_tabs=False,replace_whitespace=False,drop_whitespace=False,break_long_words=not is_html,break_on_hyphens=not is_html) or [' '])
            for line in code: story.append(para(html.escape(line,quote=False).replace(' ','&#160;'),'htmlcode' if is_html else 'code'))
            story.append(Spacer(1,9))
        elif typ=='blockquote': story+=render(t['tokens'],path,depth)
        elif typ=='hr': story.append(Spacer(1,8))
        elif typ=='html':
            text=re.sub('<[^>]+>','',t.get('text','')).strip()
            if text: story.append(para(esc(text)))
        else: raise ValueError(f'Unhandled block {typ} in {path}')
    return story

class Document(SimpleDocTemplate):
    def afterFlowable(self,flow):
        if isinstance(flow,Paragraph) and flow.style.name in ('h1','h2'):
            title=flow.getPlainText()
            self._bookmark=getattr(self,'_bookmark',0)+1
            key='section'+str(self._bookmark)
            self.canv.bookmarkPage(key)
            if flow.style.name=='h1': self._has_section=True
            level=1 if flow.style.name=='h2' and getattr(self,'_has_section',False) else 0
            self.canv.addOutlineEntry(title,key,level=level)

def build(name,title,files):
    dest=OUT/name
    label=title+' reference'
    def furniture(c,d):
        c.saveState();c.setFont('Arial',8);c.setFillColor(MUTED)
        if d.page>1:c.drawString(50,768,'Morelord Gaming  |  '+label)
        c.drawString(50,27,'Morelord Gaming  |  '+label);c.drawRightString(562,27,str(d.page));c.restoreState()
    story=[Spacer(1,55),para(title,'cover'),para('Module documentation reference','subtitle'),para('READMEs and user / GM documentation','subtitle'),Spacer(1,23),para('<b>September 7, 2026 | Local source snapshot</b>'),Spacer(1,18)]
    m=json.loads((files[0].parent/'module.json').read_text(encoding='utf-8-sig'))
    story.append(para('Local manifest version: <b>'+esc(m['version'])+'</b>. This PDF collects the source documents listed below. Original manual version labels are preserved; older manuals may not cover newer README changes. This conversion does not establish current public release availability.'))
    story.append(table([[para('<b>Included source</b>','cell'),para('<b>Document</b>','cell')]]+[[para(esc(str(p.relative_to(ROOT.parent)).replace('\\','/')),'cell'),para(esc(next((x['text'] for x in lex(p) if x['type']=='heading'),p.stem)),'cell')] for p in files],[WIDTH*.5,WIDTH*.5]))
    story.append(Spacer(1,12));story.append(para('Prepared in the shared Morelord document style. Use PDF bookmarks to navigate sections.','small'))
    for path in files:
        story.append(PageBreak())
        story += render(lex(path),path)
    buffer=BytesIO()
    doc=Document(buffer,pagesize=(612,792),leftMargin=54,rightMargin=54,topMargin=56,bottomMargin=51,title=title,author='Morelord Gaming',pageCompression=1)
    doc.build(story,onFirstPage=furniture,onLaterPages=furniture)
    dest.write_bytes(buffer.getvalue())
    p=PdfReader(dest)
    if any(not pg.extract_text().strip() for pg in p.pages): raise ValueError('Blank page in '+name)
    print(dest.name,len(p.pages),'pages')
    return {'file':dest.name,'pages':len(p.pages),'sources':[str(p.relative_to(ROOT.parent)).replace('\\','/') for p in files]}

items=[]
mapping={
 'core':['README.md'],
 'character-export':['README.md'],
 'craftworks':['README.md','USER-GUIDE.md','docs/README.md','docs/gm-manual.md','docs/player-manual.md'],
 'downtime':['README.md'],
 'encounters':['README.md','docs/README.md','docs/gm-manual.md'],
 'journeys':['README.md','docs/README.md','docs/gm-manual.md','docs/player-guide.md','docs/gm-travel-rules-reference.md'],
 'marketplace':['README.md','docs/README.md','docs/gm-manual.md','docs/player-manual.md'],
}
for slug,paths in mapping.items():
    module=ROOT.parent/('morelord-'+slug)
    title=json.loads((module/'module.json').read_text(encoding='utf-8-sig'))['title']
    items.append(build(title.replace(' ','-')+'-Reference.pdf',title,[module/p for p in paths]))
(OUT/'build-manifest.json').write_text(json.dumps(items,indent=2)+'\n',encoding='utf-8')
