import { Octokit } from "@octokit/core";
import { merge, timer } from "rxjs";
import { switchMap, map, scan, distinctUntilChanged } from "rxjs/operators";

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

const octokit = new Octokit({
});

console.log(await octokit.request('GET /rate_limit', {
  headers: {
    'X-GitHub-Api-Version': '2022-11-28'
  }
}));

function parseRepo(urlString) {
  const url = new URL(urlString);
  const pathParts = url.pathname.split('/');
  return pathParts[3];
}

function pollEndpoint(method, intervalMs = 10000) {
  return timer(0, intervalMs).pipe(
    switchMap(() => octokit.request(method, {
      org: 'ORG',
      headers: {
        'X-GitHub-Api-Version': '2022-11-28'
      }
    })),
    map((r) => {
      const { actor, created_at, id, type } = r.data[0];
      return {
        id,
        created_at,
        type,
        actor: actor.login,
        actorImage: actor.avatar_url,
        repository: parseRepo(r.url),
      };
    }),
  );
}

// Subscribe to multiple endpoints
const events$ = merge(
 //  pollEndpoint('GET /orgs/w3c/events'),
 pollEndpoint('GET /repos/chromium/chromium/events'),
 pollEndpoint('GET /repos/WebKit/WebKit/events'),
 pollEndpoint('GET /repos/mozilla-firefox/firefox/events'),
);

const latest$ = events$.pipe(
  scan((current, candidate) => {
    if (!current) return candidate;

    console.log('cand:', candidate.created_at);
    console.log('curr:', current.created_at);
    console.log('bool:', new Date(candidate.created_at) > new Date(current.created_at));

    return new Date(candidate.created_at) > new Date(current.created_at) ? candidate : current;
  }, null),
  distinctUntilChanged((a, b) => a.id === b.id),
);

const bgMap = {
  'WebKit': 'webkit',
  'firefox': 'gecko',
};

latest$.subscribe({
  next: (evt) => {
    const { actor, type, repository } = evt;
    changeBG(bgMap[repository] ?? repository);
    changeText(actor, type);
  },
  error: (err) => console.error('Error:', err)
});
