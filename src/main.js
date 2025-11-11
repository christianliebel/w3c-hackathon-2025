import { Octokit } from "@octokit/core";
import { merge, timer } from "rxjs";
import { switchMap, map, filter, scan, distinctUntilChanged } from "rxjs/operators";

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

const bgMap = new Map([
  ['WebKit', 'webkit'],
  ['firefox', 'gecko'],
]);

function changeBG(engine) {
  document.querySelector('#bg').innerText = engine;
}

function changeText(author, evt) {
  document.querySelector('#author').innerText = author;
  document.querySelector('#type').innerText = evt;
}

latest$.subscribe({
  next: (evt) => {
    const { actor, type, repository } = evt;
    changeBG(bgMap[repository] ?? repository);
    changeText(actor, type);
  },
  error: (err) => console.error('Error:', err)
});
