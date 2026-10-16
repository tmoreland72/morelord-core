export const overlaps = (a, b) => a.x < b.x+b.width && a.x+a.width > b.x && a.y < b.y+b.height && a.y+a.height > b.y;

/** Square-grid perimeter only. Never fall back to the defended interior. */
export function edgePositions({rect, size, footprints, occupied=[], inset=1, random=Math.random}) {
  if (!(size > 0) || !Number.isInteger(inset) || inset < 0) throw Error('Invalid map grid or edge inset.');
  const taken = occupied.map(b => ({...b})), result = [];
  const left = Math.ceil(rect.x/size)*size + inset*size;
  const top = Math.ceil(rect.y/size)*size + inset*size;
  const right = Math.floor((rect.x+rect.width)/size)*size - inset*size;
  const bottom = Math.floor((rect.y+rect.height)/size)*size - inset*size;
  const center={x:rect.x+rect.width/4,y:rect.y+rect.height/4,width:rect.width/2,height:rect.height/2};
  for (const [index, footprint] of footprints.entries()) {
    const width = footprint.width*size, height = footprint.height*size;
    const sides = [[], [], [], []];
    for (let depth=0; depth<3; depth++) {
      const x0=left+depth*size, y0=top+depth*size;
      const x1=right-width-depth*size, y1=bottom-height-depth*size;
      if (x0>x1 || y0>y1) continue;
      for (let x=x0; x<=x1; x+=size) {
        sides[0].push({x,y:y0}); sides[2].push({x,y:y1});
      }
      for (let y=y0; y<=y1; y+=size) {
        sides[1].push({x:x1,y}); sides[3].push({x:x0,y});
      }
    }
    let chosen;
    for (let offset=0; offset<4 && !chosen; offset++) {
      const available=sides[(index+offset)%4].filter(p => !overlaps({...p,width,height},center) && !taken.some(b => overlaps({...p,width,height},b)));
      if (available.length) chosen=available[Math.floor(random()*available.length)];
    }
    if (!chosen) throw Error('Not enough unoccupied space in the edge band. Move edge tokens or reduce the setup inset, then retry.');
    taken.push({...chosen,width,height}); result.push(chosen);
  }
  return result;
}
