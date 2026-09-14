"""Render the canonical brand guide and module source manuals in the shared Morelord document style.

Usage: python tools/build-reference-pdfs.py --node PATH --marked PATH
Requires ReportLab, Pillow, pypdf, and the marked Node package.
"""
from pathlib import Path
import argparse
import html
import json
import re
import subprocess
import textwrap
from io import BytesIO
from html.parser import HTMLParser
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
parser.add_argument('--node', required=True)
parser.add_argument('--marked', required=True)
parser.add_argument('--brand-only', action='store_true', help='Refresh the branding guide and HTML snippets only.')
args = parser.parse_args()
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
class ListingHTML(HTMLParser):
    """Render semantic listing HTML with the same body typography as Markdown."""
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.story=[]
        self.parts=[]
        self.block=None
    def handle_starttag(self,tag,attrs):
        if tag in ('p','li','h2','h3','h4'):
            self.parts=[]
            self.block=tag
        elif tag=='strong': self.parts.append('<b>')
        elif tag=='em': self.parts.append('<i>')
        elif tag=='a':
            href=dict(attrs)['href']
            self.parts.append('<link href="'+html.escape(href,quote=True)+'" color="#355b78">')
        elif tag=='br': self.parts.append('<br/>')
    def handle_endtag(self,tag):
        if tag in ('p','li','h2','h3','h4'):
            content=''.join(self.parts)
            if tag=='li':
                style=ParagraphStyle('listing-item',parent=styles['body'],leftIndent=12,firstLineIndent=-10,spaceAfter=5)
                self.story.append(Paragraph('- '+content,style))
            else: self.story.append(para(content,'h3' if tag.startswith('h') else 'body'))
            self.parts=[]
            self.block=None
        elif tag=='strong': self.parts.append('</b>')
        elif tag=='em': self.parts.append('</i>')
        elif tag=='a': self.parts.append('</link>')
    def handle_data(self,data):
        if self.block: self.parts.append(esc(data))

def render(tokens,path,depth=0):
    story=[]
    for t in tokens:
        typ=t['type']
        if typ=='space': continue
        if typ=='heading':
            if path.name=='MORELORD-BRAND-GUIDE.md' and (t['depth']==1 or (t['depth']==2 and t['text'].startswith('Morelord ') and t['text']!='Morelord Gaming suite') or t['text']=='Foundry Description (HTML)'):
                story.append(PageBreak())
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
            if path.name=='MORELORD-BRAND-GUIDE.md':
                listing=ListingHTML()
                listing.feed(t.get('text',''))
                story.extend(listing.story)
            else:
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

def build(name,title,files,brand=False):
    dest=OUT/name
    label='Branding guide' if brand else title+' reference'
    def furniture(c,d):
        c.saveState();c.setFont('Arial',8);c.setFillColor(MUTED)
        if d.page>1:c.drawString(50,768,'Morelord Gaming  |  '+label)
        c.drawString(50,27,'Morelord Gaming  |  '+label);c.drawRightString(562,27,str(d.page));c.restoreState()
    story=[Spacer(1,55),para('Morelord Branding Guide' if brand else title,'cover'),para('Brand identity, product UI, and marketing' if brand else 'Module documentation reference','subtitle'),para('One family. Consistent products and communication.' if brand else 'READMEs and user / GM documentation','subtitle'),Spacer(1,23),para('<b>September 7, 2026 | '+('Version 2.2 | Consolidated guide' if brand else 'Local source snapshot')+'</b>'),Spacer(1,18)]
    if brand:
        story += [para('The shared brand and implementation reference for the Morelord family, updated across nine local product folders. Marketing positioning and channel copy now live beside the product UI contract.'),table([[para('<b>Review focus</b>','cell'),para('<b>Contents</b>','cell')],[para('Identity and scope','cell'),para('Names, module inventory, compatibility, and planned-product boundaries.','cell')],[para('Visual system','cell'),para('Core-owned tokens, shells, controls, accessibility, and document styling.','cell')],[para('Product communication','cell'),para('Suite promise, per-product copy, channel templates, and copy governance.','cell')]], [125,379])]
    else:
        m=json.loads((files[0].parent/'module.json').read_text(encoding='utf-8-sig'))
        story.append(para('Local manifest version: <b>'+esc(m['version'])+'</b>. This PDF collects the source documents listed below. Original manual version labels are preserved; older manuals may not cover newer README changes. This conversion does not establish current public release availability.'))
        story.append(table([[para('<b>Included source</b>','cell'),para('<b>Document</b>','cell')]]+[[para(esc(str(p.relative_to(ROOT.parent)).replace('\\','/')),'cell'),para(esc(next((x['text'] for x in lex(p) if x['type']=='heading'),p.stem)),'cell')] for p in files],[WIDTH*.5,WIDTH*.5]))
    story.append(Spacer(1,12));story.append(para('Prepared in the shared Morelord document style. Use PDF bookmarks to navigate sections.','small'))
    for path in files:
        story.append(PageBreak())
        ts=lex(path)
        if brand:
            ts=ts[1:]
        story += render(ts,path)
    buffer=BytesIO()
    doc=Document(buffer,pagesize=(612,792),leftMargin=54,rightMargin=54,topMargin=56,bottomMargin=51,title=title,author='Morelord Gaming',pageCompression=1)
    doc.build(story,onFirstPage=furniture,onLaterPages=furniture)
    try:
        dest.write_bytes(buffer.getvalue())
    except PermissionError:
        if not brand: raise
        dest=OUT/(Path(name).stem+'-v2.2.pdf')
        dest.write_bytes(buffer.getvalue())
        print('Existing PDF is locked; wrote',dest.name)
    p=PdfReader(dest)
    if any(not pg.extract_text().strip() for pg in p.pages): raise ValueError('Blank page in '+name)
    print(dest.name,len(p.pages),'pages')
    return {'file':dest.name,'pages':len(p.pages),'sources':[str(p.relative_to(ROOT.parent)).replace('\\','/') for p in files]}

def export_foundry_descriptions():
    source=(ROOT/'MORELORD-BRAND-GUIDE.md').read_text(encoding='utf-8')
    folder=ROOT/'output/foundry-descriptions'
    folder.mkdir(parents=True,exist_ok=True)
    files=[]
    for match in re.finditer(r'^## (Morelord [^\n]+)\n(.*?)(?=^#{1,2} |\Z)',source,re.M|re.S):
        name,body=match.groups()
        if '### Foundry Description (HTML)' not in body: continue
        section=body.split('### Foundry Description (HTML)',1)[1]
        code=re.search(r'```html\n(.*?)\n```',section,re.S)
        if not code: raise ValueError(f'Missing literal HTML code block for {name}')
        listing=code.group(1)
        target=folder/(name.lower().replace(' ','-')+'.html')
        target.write_text(listing+'\n',encoding='utf-8')
        files.append(target.name)
    if len(files)!=8: raise ValueError(f'Expected eight HTML descriptions, found {len(files)}')
    (folder/'README.md').write_text('# Foundry HTML descriptions\n\nCopy the contents of a module HTML file into the Foundry description editor\'s HTML/source view. Each fragment is generated from the Foundry Description section in `../../MORELORD-BRAND-GUIDE.md`; edit that source and rebuild to keep the document and snippets synchronized.\n\nBoth the PDF and Markdown show literal HTML code with visible tags. These files contain the same HTML without code fences for direct reuse. No package manifest or public listing has been changed. Compendium is a draft for the existing v13 content package; confirm its distribution scope before public use.\n\n'+''.join('- ['+f+']('+f+')\n' for f in files),encoding='utf-8')

export_foundry_descriptions()
items=[build('Morelord-Branding-Guide.pdf','Morelord Branding Guide',[ROOT/'MORELORD-BRAND-GUIDE.md'],True)]
if args.brand_only:
    previous=json.loads((OUT/'build-manifest.json').read_text(encoding='utf-8'))
    items += [item for item in previous if not item['file'].startswith('Morelord-Branding-Guide')]
    (OUT/'build-manifest.json').write_text(json.dumps(items,indent=2)+'\n',encoding='utf-8')
    raise SystemExit(0)
mapping={
 'core':['README.md','CORE-GM-PRODUCT-GUIDE.md'],
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
