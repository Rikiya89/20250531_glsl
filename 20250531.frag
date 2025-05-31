// TouchDesigner GLSL TOP  (GLSL 3.30)
// “Rose-Nebula+” – brighter, grainier, sun-burst version
// 720 × 1280 ready (portrait)

// ──────────────────────────────────────
uniform float time;
uniform vec2  resolution;
out vec4 fragColor;

// ──────────────────────────────────────
//  Utility – HSV → RGB
// ──────────────────────────────────────
vec3 hsv2rgb(vec3 c){
    vec3 p = abs(fract(c.x + vec3(0.0, 2./3., 1./3.)) * 6.0 - 3.0);
    return c.z * mix(vec3(1.0), clamp(p - 1.0, 0.0, 1.0), c.y);
}

// ──────────────────────────────────────
//  Hash / noise helpers
// ──────────────────────────────────────
float hash21(vec2 p){ return fract(sin(dot(p,vec2(27.619,57.583)))*43758.5453); }

// 3-octave fBm  – same as before
float noise(vec2 p){
    vec2 i=floor(p),f=fract(p); vec2 u=f*f*(3.0-2.0*f);
    return mix(mix(hash21(i),hash21(i+vec2(1,0)),u.x),
               mix(hash21(i+vec2(0,1)),hash21(i+vec2(1,1)),u.x),u.y);
}
float fbm(vec2 p){
    float a=.5,v=0.;
    for(int i=0;i<3;i++){ v+=a*noise(p); p*=2.; a*=.5; }
    return v;
}

// ──────────────────────────────────────
//  Warps (rose + swirl)
// ──────────────────────────────────────
vec2 swirl(vec2 uv,float k){ float r=length(uv); float a=atan(uv.y,uv.x)+k*r;
    return vec2(cos(a),sin(a))*r; }
vec2 rose(vec2 uv,float petals){
    float r=length(uv); float a=atan(uv.y,uv.x);
    return uv * mix(.4,1.,cos(petals*a)) * r * .8;
}

// Sun-burst layer
float burstLayer(float a,float len,float speed,float spokes){
    float ray = abs(sin(a*spokes - time*speed));
    return smoothstep(.0,.3,ray) * (1.0-len);
}

// ──────────────────────────────────────
//  MAIN
// ──────────────────────────────────────
void main(){
    // aspect-correct UV
    float scale=min(resolution.x,resolution.y);
    vec2  uv=(gl_FragCoord.xy-.5*resolution.xy)/scale;

    // warps
    uv = rose(uv,6.);
    uv = swirl(uv,1.2);

    float len=length(uv);
    float ang=atan(uv.y,uv.x);

    // Layers ---------------------------------------------------------
    float rings = smoothstep(.02,.0,abs(sin(len*18.-time*2.))); // radiant rings
    float fog   = fbm(uv*3. + time*.05);                         // nebula fog
    float burst = burstLayer(ang,len,1.5,12.);                   // sun-burst rays

    // Pastel gradient by radius (centre peach → outer turquoise)
    float t = smoothstep(.0,1.0,len*1.2);
    vec3 grad = mix(hsv2rgb(vec3(.02,.35,.95)),  // light peach
                    hsv2rgb(vec3(.55,.25,.85)),  // turquoise
                    t);

    // Colour palette
    float hBase = fract(time*.03);
    vec3 colFog   = hsv2rgb(vec3(hBase+.5,.3,.8)) * fog*.7;
    vec3 colRings = hsv2rgb(vec3(hBase+.1,.45,.95))* rings;
    vec3 colBurst = hsv2rgb(vec3(hBase+.25,.2,1.0))* burst*1.2;

    vec3 color = grad + colFog + colRings + colBurst;

    // Film-grain sparkle
    color += (hash21(gl_FragCoord.xy+time)*.06 - .03);

    // Vignette
    color *= smoothstep(.95,.25,len);

    // Mild gamma lift for softness
    color = pow(color, vec3(.9));

    fragColor = TDOutputSwizzle(vec4(color,1.0));
}
