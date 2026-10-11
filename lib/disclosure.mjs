// A real foreground element lets the existing motion owner rotate the indicator.
export function disclosureIndicator(button, doc = document, style = getComputedStyle) {
    const icon=doc.createElement('span'); icon.className='disclosure-chevron';
    icon.setAttribute('aria-hidden','true'); button.append(icon);
    return {set(open,motion=null){
        const wasOpen=button.getAttribute('aria-expanded')==='true';
        if(wasOpen===open){button.setAttribute('aria-expanded',String(open));return;}
        const before=style(icon).transform;
        motion?.cancel(icon);
        button.setAttribute('aria-expanded',String(open));
        motion?.play(button,icon,[{transform:before},{transform:`rotate(${open?-180:0}deg)`}]);
    }};
}
