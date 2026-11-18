// faces.js — original illustrated avatars of Indian women (inline SVG, no photos).
// Each face: skin tone, sari colour, hair style (bun / plait / dupatta / grey), bindi, earrings.
const FACES = [
  { skin: '#c68a5a', sari: '#d6336c', border: '#f2c94c', hair: 'bun',     hairC: '#1b1210' },
  { skin: '#a8703f', sari: '#1c7ed6', border: '#ffd43b', hair: 'plait',   hairC: '#120b08' },
  { skin: '#b97a4c', sari: '#f08c00', border: '#c2255c', hair: 'dupatta', hairC: '#1b1210', dup: '#7048e8' },
  { skin: '#9b6538', sari: '#2f9e44', border: '#ffe066', hair: 'bun',     hairC: '#140c09' },
  { skin: '#c98d5e', sari: '#ae3ec9', border: '#ffd43b', hair: 'grey',    hairC: '#9a9a9a', glasses: true },
  { skin: '#8d5a32', sari: '#e8590c', border: '#fcc419', hair: 'dupatta', hairC: '#120b08', dup: '#e64980' }
];
function faceSVG(i, size = 56) {
  const f = FACES[i % FACES.length];
  const shade = '#00000022';
  const hairBack = f.hair === 'plait'
    ? `<path d="M64 52 q14 30 4 58" stroke="${f.hairC}" stroke-width="9" fill="none" stroke-linecap="round"/>`
    : f.hair === 'bun' || f.hair === 'grey' ? `<circle cx="50" cy="20" r="11" fill="${f.hairC}"/>` : '';
  const dupatta = f.hair === 'dupatta'
    ? `<path d="M20 60 Q18 18 50 16 Q82 18 80 60 Q78 40 50 34 Q22 40 20 60Z" fill="${f.dup}"/>
       <path d="M20 60 Q16 90 26 112 L36 112 Q26 86 30 60Z" fill="${f.dup}"/>` : '';
  return `<svg viewBox="0 0 100 100" width="${size}" height="${size}" role="img" aria-label="Avatar of an Indian woman">
    <defs><clipPath id="c${i}${size}"><circle cx="50" cy="50" r="50"/></clipPath></defs>
    <g clip-path="url(#c${i}${size})">
      <rect width="100" height="100" fill="#fff4e6"/>
      ${hairBack}
      <path d="M14 112 Q16 74 50 72 Q84 74 86 112Z" fill="${f.sari}"/>
      <path d="M30 76 L64 112 L76 112 L42 74Z" fill="${f.border}" opacity=".9"/>
      <rect x="43" y="60" width="14" height="14" rx="5" fill="${f.skin}"/>
      <path d="M43 70 Q50 76 57 70" stroke="${shade}" stroke-width="3" fill="none"/>
      <ellipse cx="50" cy="46" rx="19" ry="22" fill="${f.skin}"/>
      <path d="M30 44 Q30 22 50 22 Q70 22 70 44 Q66 32 50 31 Q36 31 30 44Z" fill="${f.hairC}"/>
      <path d="M50 22 L50 31" stroke="#c92a2a" stroke-width="2"/>
      ${dupatta}
      <circle cx="31" cy="52" r="3" fill="#f2c94c"/><circle cx="69" cy="52" r="3" fill="#f2c94c"/>
      <circle cx="31" cy="57" r="2" fill="#f2c94c"/><circle cx="69" cy="57" r="2" fill="#f2c94c"/>
      <ellipse cx="42" cy="46" rx="2.4" ry="2.8" fill="#1b1210"/><ellipse cx="58" cy="46" rx="2.4" ry="2.8" fill="#1b1210"/>
      <path d="M38 41 Q42 39 46 41 M54 41 Q58 39 62 41" stroke="#1b1210" stroke-width="1.6" fill="none" stroke-linecap="round"/>
      ${f.glasses ? '<circle cx="42" cy="46" r="6" stroke="#5c4033" stroke-width="1.6" fill="none"/><circle cx="58" cy="46" r="6" stroke="#5c4033" stroke-width="1.6" fill="none"/><path d="M48 46 L52 46" stroke="#5c4033" stroke-width="1.6"/>' : ''}
      <circle cx="50" cy="36" r="2.6" fill="#e03131"/>
      <path d="M50 47 Q48 53 51 54" stroke="${shade}" stroke-width="2" fill="none"/>
      <circle cx="54" cy="53" r="1.2" fill="#f2c94c"/>
      <path d="M43 59 Q50 64 57 59" stroke="#8a2e2e" stroke-width="2.2" fill="none" stroke-linecap="round"/>
      <circle cx="38" cy="55" r="3" fill="#ff8787" opacity=".35"/><circle cx="62" cy="55" r="3" fill="#ff8787" opacity=".35"/>
    </g></svg>`;
}
// A learner's avatar: a face index (new) or an emoji (older profiles)
function avatarHTML(a, size) { return typeof a === 'number' ? faceSVG(a, size) : (a || faceSVG(0, size)); }
