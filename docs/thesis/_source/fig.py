from PIL import Image, ImageDraw, ImageFont
S=3  # scale
W,H=1660*S,720*S
img=Image.new('RGB',(W,H),'white'); d=ImageDraw.Draw(img)
F='/usr/share/fonts/truetype/liberation/LiberationSerif-Regular.ttf'
FB='/usr/share/fonts/truetype/liberation/LiberationSerif-Bold.ttf'
f=ImageFont.truetype(F,24*S); fb=ImageFont.truetype(FB,27*S); fs=ImageFont.truetype(F,22*S)
def box(x,y,w,h,title,lines,fill='#f2f2f2'):
    x,y,w,h=[v*S for v in (x,y,w,h)]
    d.rounded_rectangle([x,y,x+w,y+h],radius=10*S,outline='black',width=2*S,fill=fill)
    tw=d.textlength(title,font=fb); d.text((x+(w-tw)/2,y+10*S),title,font=fb,fill='black')
    yy=y+52*S
    for l in lines:
        tw=d.textlength(l,font=f); d.text((x+(w-tw)/2,yy),l,font=f,fill='black'); yy+=31*S
def arrow(x1,y1,x2,y2,label=None,dash=False,lx=0,ly=-22):
    x1,y1,x2,y2=[v*S for v in (x1,y1,x2,y2)]
    if dash:
        import math
        L=math.hypot(x2-x1,y2-y1); n=int(L/(12*S))
        for i in range(0,n,2):
            a=i/n; b=min((i+1)/n,1)
            d.line([x1+(x2-x1)*a,y1+(y2-y1)*a,x1+(x2-x1)*b,y1+(y2-y1)*b],fill='black',width=2*S)
    else: d.line([x1,y1,x2,y2],fill='black',width=2*S)
    import math
    ang=math.atan2(y2-y1,x2-x1); s=12*S
    p=[(x2,y2),(x2-s*math.cos(ang-0.4),y2-s*math.sin(ang-0.4)),(x2-s*math.cos(ang+0.4),y2-s*math.sin(ang+0.4))]
    d.polygon(p,fill='black')
    if label:
        for k,l in enumerate(label.split('|')):
            tw=d.textlength(l,font=fs); d.text(((x1+x2)/2-tw/2+lx*S,(y1+y2)/2+(ly+26*k)*S),l,font=fs,fill='black')
box(20,140,290,170,'Producer',['farmer, peasant farm,','agricultural enterprise','stock kept in a notebook'])
box(560,20,330,170,'Intermediary',['reseller at a wholesale','market or local collector','buys cheap, adds margin'])
box(560,320,330,170,'Search channels',['phone calls, Viber and','Facebook groups,','classified ads (999.md)'])
box(1110,140,330,170,'Wholesale buyer',['distributor, shop chain,','restaurant (HoReCa),','processor'])
box(1490,170,150,110,'End',['consumer'],fill='white')
arrow(310,185,560,110,'sells part of the|harvest on the spot',lx=-40,ly=-75)
arrow(310,265,560,400,'posts offers,|waits for calls',lx=-60,ly=22)
arrow(890,110,1110,185,'resells with|a markup',lx=50,ly=-60)
arrow(890,400,1110,265,'price and quantity|agreed by phone',lx=60,ly=18)
arrow(310,225,1110,225,'direct deal with a known buyer|(oral agreement, own transport)',dash=True,ly=12)
arrow(1440,225,1490,225)
# bottom notes
y=530
d.rounded_rectangle([30*S,y*S,1630*S,(y+180)*S],radius=8*S,outline='#555555',width=1*S,fill='#fafafa')
d.text((50*S,(y+12)*S),'Information that is not recorded in one place:',font=fb,fill='black')
notes=['- the quantity still available after each phone deal;','- the agreed price, delivery date and the status of each order;',
'- the history of messages and agreements between the parties;','- the reliability of a buyer or a seller (known only by word of mouth).']
for i,n in enumerate(notes): d.text((70*S,(y+46+31*i)*S),n,font=f,fill='black')
img=img.resize((2000,int(2000*H/W)),Image.LANCZOS)
img.save(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'fig1_1.png'),dpi=(200,200))
