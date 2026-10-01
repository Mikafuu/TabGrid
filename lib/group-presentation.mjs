// Use this shared marker + name whenever displaying a group identity.
export const groupColors={grey:'#80868b',blue:'#8ab4f8',red:'#f28b82',yellow:'#fdd663',green:'#81c995',pink:'#ff8bcb',purple:'#c58af9',cyan:'#78d9ec',orange:'#fcad70'};
export function groupLabel(group){
    const label=document.createElement('span');label.className='group-label';
    const dot=document.createElement('span');dot.className='group-marker';dot.style.backgroundColor=groupColors[group.color]||groupColors.grey;dot.setAttribute('aria-hidden','true');
    const text=document.createElement('span');text.textContent=group.title||'Untitled group';label.append(dot,text);return label;
}
export function groupColorPicker(value='blue'){
    const field=document.createElement('fieldset');field.className='group-color-picker';
    const legend=document.createElement('legend');legend.textContent='Color';field.append(legend);
    const row=document.createElement('div');row.className='group-color-options';field.append(row);
    const name=`group-color-${crypto.randomUUID()}`;
    for(const [color,fill]of Object.entries(groupColors)){
        const label=document.createElement('label'),input=document.createElement('input'),text=document.createElement('span');
        input.type='radio';input.name=name;input.value=color;input.checked=color===value;input.setAttribute('aria-label',color);input.style.setProperty('--dot',fill);
        text.className='sr-only';text.textContent=color;label.append(input,text);row.append(label);
    }
    return {field,get value(){return row.querySelector('input:checked').value;}};
}
