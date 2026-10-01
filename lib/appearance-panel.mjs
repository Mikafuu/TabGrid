import { THEMES, FONTS, STYLES } from './appearance.mjs';
const node=(tag,text='')=>{const el=document.createElement(tag);el.textContent=text;return el;};
export function mountAppearance(panel,{getPrefs,save,act}) {
    const intro=node('p','Changes apply immediately. Styles, color tints, and fonts are available offline.');
    const row=node('div');row.className='appearance-controls';
    const controls=new Map();
    for(const [key,label,options]of [
        ['colorMode','Color mode',[['system','Follow system'],['light','Light'],['dark','Dark']]],
        ['font','Interface font',FONTS.map(f=>[f.id,f.name])]
    ]){
        const wrap=node('label'),select=node('select');select.id=`pref-${key}`;select.setAttribute('aria-describedby','settings-error');
        for(const [value,text]of options){const option=node('option',text);option.value=value;select.append(option);}
        select.onchange=()=>act(async()=>{try{await save({[key]:select.value});select.removeAttribute('aria-invalid');}catch(error){select.setAttribute('aria-invalid','true');sync();throw error;}});
        wrap.append(node('span',label),select);row.append(wrap);controls.set(key,select);
    }
    const styleGallery=node('fieldset');styleGallery.className='style-gallery';styleGallery.append(node('legend','Visual style'));
    const styleHelp=node('p','Choose the surface treatment, then apply any color tint below. Classic keeps the original theme finishes.');styleGallery.append(styleHelp);
    const styleList=node('div');styleList.className='style-options';styleGallery.append(styleList);const styleRadios=new Map();
    for(const style of STYLES){
        const label=node('label');label.className='style-choice';
        const input=node('input');input.type='radio';input.name='appearance-style';input.value=style.id;input.setAttribute('aria-label',style.name+' style');
        const preview=node('span');preview.className='material-sample';preview.dataset.material=style.id;preview.setAttribute('aria-hidden','true');
        const tile=node('span');tile.className='material-sample-tile';tile.append(node('i'),node('i'));preview.append(tile,node('span'));
        label.append(input,preview,node('strong',style.name),node('small',style.description));styleList.append(label);styleRadios.set(style.id,input);
        input.onchange=()=>{if(input.checked)act(async()=>{try{await save({visualStyle:style.id});}catch(error){sync();throw error;}});};
    }
    const sample=node('div');sample.className='font-sample';sample.append(node('span','Your tabs, your space.'),node('small','Aa Bb Cc 0123456789'));
    const selection=node('p');selection.className='appearance-current';selection.setAttribute('aria-live','polite');
    const gallery=node('fieldset');gallery.className='theme-gallery';gallery.append(node('legend','Color tint'));
    const radios=new Map(),families=new Map();let lastTheme=null;
    for(const family of [...new Set(THEMES.map(t=>t.family))]){
        const group=node('details');group.className='theme-family';families.set(family,group);group.open=(THEMES.find(t=>t.id===getPrefs().theme)||THEMES[0]).family===family;group.append(node('summary',`${family} (${THEMES.filter(t=>t.family===family).length})`));
        const list=node('div');list.className='theme-options';group.append(list);gallery.append(group);
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
    const reset=node('button','Reset appearance');reset.type='button';reset.onclick=()=>act(async()=>{await save({visualStyle:'classic',colorMode:'system',theme:'calm',font:'geist',motion:'system',showAddress:true,showLastUsed:false,showWindow:false,showGroup:true});sync();});
    panel.insertBefore(intro,panel.children[1]||null);intro.after(styleGallery,row,sample,selection,gallery,reset);
    function sync(){const prefs=getPrefs();for(const [key,input]of controls)input.value=prefs[key];for(const [id,input]of styleRadios)input.checked=id===prefs.visualStyle;for(const [id,input]of radios)input.checked=id===prefs.theme;const theme=THEMES.find(t=>t.id===prefs.theme)||THEMES[0];if(lastTheme!==theme.id){families.get(theme.family).open=true;lastTheme=theme.id;}selection.textContent=`Color tint: ${theme.name}`;sample.style.fontFamily=(FONTS.find(f=>f.id===prefs.font)||FONTS[0]).family;}
    sync();return {sync};
}
