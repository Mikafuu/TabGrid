import { tr } from './i18n.mjs';
import { mountBackgroundPanel } from './background-panel.mjs';
import { disclosureIndicator } from './disclosure.mjs';
import { THEMES, FONTS, STYLES } from './appearance.mjs';
const node=(tag,text='')=>{const el=document.createElement(tag);el.textContent=text;return el;};
export function mountAppearance(panel,{background,getPrefs,save,rpc,act,motion,privateMode,help}) {
    const intro=node('p',tr("Changes apply immediately. Styles, color tints, and fonts are available offline."));
    const row=node('div');row.className='appearance-controls';
    const controls=new Map();
    for(const [key,label,options]of [
        ['colorMode',tr("Color mode"),[['system',tr("Follow system")],['light',tr("Light")],['dark',tr("Dark")]]],
        ['font',tr("Interface font"),FONTS.map(f=>[f.id,f.name])]
    ]){
        const wrap=node('label'),select=node('select');select.id=`pref-${key}`;select.setAttribute('aria-describedby','settings-error');
        for(const [value,text]of options){const option=node('option',text);option.value=value;select.append(option);}
        select.onchange=()=>act(async()=>{try{await save({[key]:select.value});select.removeAttribute('aria-invalid');}catch(error){select.setAttribute('aria-invalid','true');sync();throw error;}});
        wrap.append(node('span',label),select);row.append(wrap);controls.set(key,select);
    }
    const styleGallery=node('fieldset');styleGallery.className='style-gallery';styleGallery.append(node('legend',tr("Visual style")));
    const styleHelp=node('p',tr("Choose the surface treatment, then apply any color tint below. Classic keeps the original theme finishes."));help(styleGallery.querySelector('legend'),styleHelp);
    const styleList=node('div');styleList.className='style-options';styleGallery.append(styleList);const styleRadios=new Map();
    for(const style of STYLES){
        const label=node('label');label.className='style-choice';
        const input=node('input');input.type='radio';input.name='appearance-style';input.value=style.id;input.id=`style-${style.id}`;input.setAttribute('aria-label',tr('{0} style',[style.name]));
        const preview=node('span');preview.className='material-sample';preview.dataset.material=style.id;preview.setAttribute('aria-hidden','true');
        const tile=node('span');tile.className='material-sample-tile';tile.append(node('i'),node('i'));preview.append(tile,node('span'));
        label.append(input,preview,node('strong',style.name),node('small',style.description));styleList.append(label);styleRadios.set(style.id,input);
        input.onchange=()=>{if(input.checked)act(async()=>{try{await save({visualStyle:style.id});}catch(error){sync();throw error;}});};
    }
    const batteryTip=help(styleList.querySelector('input[value=glass]').closest('label').querySelector('strong'),tr("Glassmorphism uses more graphics power and may shorten battery life. Choose Classic or Flat to save power."),tr("Glassmorphism battery use"));
    const sample=node('div');sample.className='font-sample';sample.append(node('span',tr("Your tabs, your space.")),node('small','Aa Bb Cc 0123456789'));
    const selection=node('p');selection.className='appearance-current';selection.setAttribute('aria-live','polite');
    const gallery=node('fieldset');gallery.className='theme-gallery';gallery.append(node('legend',tr("Color tint")),selection);
    const radios=new Map(),families=new Map();let lastTheme=null;
    for(const family of [...new Set(THEMES.map(t=>t.family))]){
        const group=node('section');group.className='theme-family';
        const toggle=node('button',`${family} (${THEMES.filter(t=>t.family===family).length})`);toggle.type='button';toggle.className='tint-toggle';group.append(toggle);
        const content=node('div');content.className='tint-content';content.id=`tints-${family.toLowerCase()}`;toggle.setAttribute('aria-controls',content.id);
        const list=node('div');list.className='theme-options';content.append(list);group.append(content);gallery.append(group);
        const indicator=disclosureIndicator(toggle);
        function expand(open,animate=true){
            indicator.set(open,animate?motion:null);
            if(animate&&motion)motion.disclose(content,open,group);
            else{content.toggleAttribute('data-collapsed',!open);content.inert=!open;content.setAttribute('aria-hidden',String(!open));}
        }
        families.set(family,{expand});
        expand((THEMES.find(t=>t.id===getPrefs().theme)||THEMES[0]).family===family,false);
        toggle.onclick=()=>expand(toggle.getAttribute('aria-expanded')!=='true');
        for(const theme of THEMES.filter(t=>t.family===family)){
            const label=node('label');label.className='theme-choice';
            const input=node('input');input.type='radio';input.name='appearance-theme';input.value=theme.id;input.setAttribute('aria-label',theme.name);
            const swatches=node('span');swatches.className='theme-swatches';swatches.setAttribute('aria-hidden','true');
            // Both modes are shown so the preview does not depend on the OS mode.
            for(const palette of [theme.light,theme.dark])for(const key of ['bg','surface','accent']){const chip=node('i');chip.style.backgroundColor=palette[key];swatches.append(chip);}
            const name=node('span',theme.name);name.className='theme-name';const description=node('small',theme.description);
            label.append(input,swatches,name,description);list.append(label);radios.set(theme.id,input);
            input.onchange=()=>{if(input.checked)act(async()=>{try{await save({theme:theme.id});}catch(error){sync();throw error;}});};
        }
    }
    const backgroundPanel=mountBackgroundPanel(panel,{background,getPrefs,save,rpc,act,privateMode,help});
    const reset=node('button',tr("Reset appearance"));reset.type='button';reset.onclick=()=>act(async()=>{await save({...(!privateMode?{backgroundTransparency:35,backgroundBlur:0,backgroundZoom:100,backgroundX:50,backgroundY:50}:{}),visualStyle:'classic',colorMode:'system',theme:'calm',font:'geist',motion:'system',animationSpeed:'standard',showAddress:true,showLastUsed:false,showWindow:false,showGroup:true});if(!privateMode)await rpc('background','remove');sync();});
    help(panel.querySelector('h3'),intro);panel.children[0].after(styleGallery,row,sample,gallery,backgroundPanel.box,reset);
    function sync(){backgroundPanel.sync();const prefs=getPrefs();batteryTip.hidden=prefs.visualStyle!=='glass';for(const [key,input]of controls)input.value=prefs[key];for(const [id,input]of styleRadios)input.checked=id===prefs.visualStyle;for(const [id,input]of radios)input.checked=id===prefs.theme;const theme=THEMES.find(t=>t.id===prefs.theme)||THEMES[0];if(lastTheme!==theme.id){families.get(theme.family).expand(true,false);lastTheme=theme.id;}selection.textContent=tr("Color tint: {0}", [theme.name]);sample.style.fontFamily=(FONTS.find(f=>f.id===prefs.font)||FONTS[0]).family;}
    sync();return {sync};
}
