let changeBG_aux = (color1, color2) => {
    document.body.style.background = `linear-gradient(${color1}, ${color2})`;
};

let changeBG = (engine) => {
    
    switch(engine) {
        case 'gecko':
            changeBG_aux('rgba(255, 110, 38, .4)', 'rgba(255, 204, 0, .4)');
            break;
        case 'webkit':
            changeBG_aux('rgba(0, 173, 239, .4)', 'rgba(251, 176, 52, .4)');
            break;  
        case 'chromium':
            changeBG_aux('rgba(0, 120, 215, .4)', 'rgba(93, 225, 107, .4)');
            break;
        default:
            changeBG_aux('rgba(215, 3, 162, 0.4)', 'rgba(6, 204, 239, 0.4)');
    }
}

let changeText = (userHandle, action) => {
    let user = document.querySelector('.userHandle');
    user.style.marginLeft = '-2em';
    user.innerText = userHandle;
    user.style.marginLeft = '0em';
    let act = document.querySelector('.action');
    act.style.marginLeft = '2em';
    act.innerText = action;
    act.style.marginLeft = '0em';

}
