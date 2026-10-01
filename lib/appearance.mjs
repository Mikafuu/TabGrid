// Aesthetic presets, not implementations of third-party design systems.
// Every preset preserves the grid's stable slots and Chrome's group colors.
const palette = (bg, surface, text, muted, line, accent, selected) => ({bg, surface, text, muted, line, accent, selected});
const light = (bg, surface, accent, selected, text='#292e33', muted='#62666a', line='#d4d7d9') => palette(bg,surface,text,muted,line,accent,selected);
const dark = (bg, surface, accent, selected, text='#e8eae8', muted='#bec6c4', line='#475050') => palette(bg,surface,text,muted,line,accent,selected);
export const THEMES = [
    {id:'calm',name:'Calm editorial',family:'Editorial',description:'Warm neutrals and restrained blue.',finish:'soft',light:light('#f6f5f1','#fdfdfb','#415d8b','#e7edf6'),dark:dark('#202322','#292d2c','#b1c5e7','#354454')},
    {id:'minimalist',name:'Utilitarian minimalism',family:'Editorial',description:'Warm monochrome, flat surfaces, pastel detail.',finish:'flat',light:light('#f7f6f3','#fbfbfa','#346538','#edf3ec'),dark:dark('#242523','#2c2e2a','#b3ceb4','#344238')},
    {id:'editorial',name:'Editorial / magazine',family:'Editorial',description:'Paper tones with ink-blue details.',finish:'paper',light:light('#faf9f5','#fffefa','#334f73','#e6ebf1'),dark:dark('#22262b','#2c3138','#bed0e8','#394657')},
    {id:'editorial-luxury',name:'Editorial luxury',family:'Editorial',description:'Warm cream, sage, and espresso.',finish:'paper',light:light('#fdfbf7','#fffdf9','#50624b','#e9eee5','#322d28','#70665c','#ded8ce'),dark:dark('#292521','#342f29','#c0cdb3','#414637','#eee9e1','#bdb1a4','#514a42')},
    {id:'warm-craft',name:'Warm craft',family:'Editorial',description:'Cream and brass with deep brown ink.',finish:'paper',light:light('#f5f1ea','#fbf8f1','#795b25','#eee4ce','#30291f','#706354','#ded4c4'),dark:dark('#29251e','#342e25','#d9c297','#49402e','#eee7db','#bcb09b','#534a3b')},
    {id:'soft-structuralism',name:'Soft structuralism',family:'Structure',description:'Silver surfaces and diffused depth.',finish:'soft',light:light('#f0f2f4','#fcfcfd','#485a70','#e7edf3'),dark:dark('#23272c','#2e333a','#c0cede','#3d4958')},
    {id:'bento',name:'Bento',family:'Structure',description:'Soft tile enclosures and quiet blue.',finish:'bezel',light:light('#f0f2f5','#fafbfc','#3f618a','#e5edf7'),dark:dark('#20262e','#2a323d','#b8ceed','#394a60')},
    {id:'brutalism',name:'Brutalism',family:'Structure',description:'Sharp corners, firm outlines, bold ink.',finish:'sharp',light:light('#f4f3ed','#fffef8','#363a31','#e5e8dc','#242621','#5d6157','#7b8074'),dark:dark('#20221d','#2a2d26','#d3dac4','#3d4530','#edf0e5','#b2baa6','#858e78')},
    {id:'kinetic',name:'Kinetic typography',family:'Structure',description:'Strong type and high-contrast violet detail.',finish:'type',light:light('#f7f6fa','#fdfcff','#59457e','#eee7f5'),dark:dark('#25212d','#312b3b','#d0bced','#463855')},
    {id:'cinematic',name:'Cinematic',family:'Atmosphere',description:'Wide tonal depth and cool blue.',finish:'ambient',light:light('#eef1f5','#f8faff','#39567e','#e1e9f5'),dark:dark('#171e29','#242e3d','#b5cbec','#344762')},
    {id:'glass',name:'Glassmorphism',family:'Atmosphere',description:'Frosted overlays with clear surfaces.',finish:'glass',light:light('#edf3f3','#f9fcfc','#32656b','#deedef'),dark:dark('#19292c','#25373a','#acd4d8','#324b50')},
    {id:'liquid-glass',name:'Liquid glass',family:'Atmosphere',description:'Rounded highlights and frosted overlays.',finish:'glass-bezel',light:light('#eef2f7','#fafcff','#415e87','#e3edf9'),dark:dark('#1b2633','#283545','#b6cff0','#354c67')},
    {id:'ethereal-glass',name:'Ethereal glass',family:'Atmosphere',description:'Deep tones, violet light, fine highlights.',finish:'ethereal',light:light('#f2f0f8','#fcfaff','#61517e','#eae4f4'),dark:dark('#15121c','#24202f','#d0b9eb','#3d3150')},
    {id:'aurora',name:'Aurora / mesh',family:'Atmosphere',description:'A muted green wash behind solid surfaces.',finish:'ambient',light:light('#eff5f1','#fafffb','#356453','#e0eee6'),dark:dark('#1b2824','#283830','#b3d9c7','#355344')},
    {id:'dark-tech',name:'Dark tech / hacker',family:'Atmosphere',description:'Terminal-inspired green and graphite.',finish:'sharp',light:light('#eff4ef','#f9fdf8','#28613c','#dfeee0'),dark:dark('#151f19','#202e25','#a1d5af','#2e4837')},
    {id:'cold-luxury',name:'Cold luxury',family:'Palettes',description:'Silver, chrome, and smoke.',finish:'bezel',light:light('#edf0f2','#f8fafb','#485e70','#e2e9ee'),dark:dark('#20272d','#2d353d','#bacbd8','#3b4a56')},
    {id:'forest',name:'Forest',family:'Palettes',description:'Deep green and bone with amber.',finish:'soft',light:light('#f0f3eb','#f9fbf4','#73602f','#eee7d2','#263b31','#5a6659','#d3dccf'),dark:dark('#1c2b24','#293b30','#e0c98e','#4a4530','#e7eee3','#b3c0af','#45584a')},
    {id:'black-tan',name:'Black and tan',family:'Palettes',description:'Warm tan against charcoal.',finish:'flat',light:light('#f4f1ed','#fcfaf7','#775b3d','#ede2d4','#2c2824','#6c6359','#d9d1c7'),dark:dark('#23211f','#2f2b27','#dabd96','#493e30','#eee8e0','#bdb2a4','#50473d')},
    {id:'cobalt-cream',name:'Cobalt and cream',family:'Palettes',description:'Cobalt detail against a warm neutral.',finish:'flat',light:light('#f8f7ef','#fffdf4','#315abb','#e4eafd'),dark:dark('#1e2635','#2a354b','#b3c9ff','#394c73')},
    {id:'terracotta-slate',name:'Terracotta and slate',family:'Palettes',description:'Rust accents and cool gray.',finish:'soft',light:light('#f0f2f3','#fbfcfc','#9a4d36','#f2e5df'),dark:dark('#252a2e','#31383e','#efb59e','#554039')},
    {id:'olive-brick',name:'Olive, brick, and paper',family:'Palettes',description:'Olive neutrals with brick-red details.',finish:'paper',light:light('#f3f4eb','#fcfcf5','#984638','#f3e5de','#30362b','#606654','#d8ddc9'),dark:dark('#272c22','#343c2b','#e7b1a3','#54423a','#edf0e1','#b5bea5','#505b42')},
    {id:'monochrome',name:'Monochrome + pop',family:'Palettes',description:'Neutral surfaces with emerald accents.',finish:'flat',light:light('#f3f4f3','#fcfdfc','#22664d','#dfefe6'),dark:dark('#222524','#2c302e','#a2d8bf','#324f40')}
];
export const STYLES = [
    {id:'classic',name:'Classic',description:'The original theme finishes.'},
    {id:'flat',name:'Flat',description:'Bold color blocks, crisp controls, no shadows.'},
    {id:'glass',name:'Glassmorphism',description:'Frosted panes, clear controls, beveled light.'},
    {id:'neumorphic',name:'Neumorphism',description:'Soft molded surfaces and sunken controls.'},
    {id:'clay',name:'Claymorphism',description:'Floating clay tiles and softly molded controls.'}
];
export const FONTS = [
    {id:'geist',name:'Geist',family:'Geist, system-ui, sans-serif',description:'Crisp and familiar'},
    {id:'outfit',name:'Outfit',family:'Outfit, system-ui, sans-serif',description:'Geometric and rounded'},
    {id:'jakarta',name:'Plus Jakarta Sans',family:'"Plus Jakarta Sans", system-ui, sans-serif',description:'Open and friendly'},
    {id:'newsreader',name:'Newsreader',family:'Newsreader, Georgia, serif',description:'Editorial serif'},
    {id:'mono',name:'Geist Mono',family:'"Geist Mono", ui-monospace, monospace',description:'Monospaced and technical'},
    {id:'system',name:'System font',family:'system-ui, sans-serif',description:'Your device’s interface font'}
];
export function resolveAppearance(prefs, systemDark=false) {
    const theme=THEMES.find(t=>t.id===prefs.theme)||THEMES[0];
    const font=FONTS.find(f=>f.id===prefs.font)||FONTS[0];
    const style=STYLES.find(s=>s.id===prefs.visualStyle)||STYLES[0];
    const mode=prefs.colorMode==='dark'||(prefs.colorMode!=='light'&&systemDark)?'dark':'light';
    return {theme,font,style,mode,palette:theme[mode]};
}
export function applyAppearance(root,prefs,systemDark=false) {
    const {theme,font,style,mode,palette:p}=resolveAppearance(prefs,systemDark),isDark=mode==='dark';
    Object.assign(root.dataset,{theme:theme.id,colorMode:mode,finish:style.id==='classic'?theme.finish:'material',visualStyle:style.id,font:font.id});
    const vars={...p,'surface-raised':p.surface,control:`color-mix(in srgb, ${p.bg}, ${p.text} 3%)`,
        'on-accent':isDark?'#18221e':'#ffffff',danger:isDark?'#ffb4aa':'#aa3932',
        'last-opened':isDark?'#b1c5e7':'#435b86','last-opened-text':isDark?'#182b45':'#ffffff',
        'ui-font':font.family,'group-tint':isDark?'24%':'36%',
        'soft-shadow':`0 2px 8px ${p.text}${isDark?'16':'08'}, 0 12px 36px ${p.text}0b`,
        'menu-shadow':`0 4px 12px ${p.text}0d, 0 18px 48px ${isDark?'#080d1655':p.text+'1a'}`};
    for(const [name,value]of Object.entries(vars))root.style.setProperty(`--${name}`,value);
    root.style.colorScheme=mode;
}
