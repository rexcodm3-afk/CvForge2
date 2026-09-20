const base = 'http://localhost:3000';
const jar = {};

async function request(method, path, body, cookie = '') {
  const res = await fetch(base + path, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });

  const text = await res.text();
  const set = res.headers.get('set-cookie');
  const rawCookie = set ? set.split(';')[0] : '';
  if (rawCookie) {
    jar.session = rawCookie.split('=')[1];
  }
  const nextCookie = jar.session ? 'cvforge_session=' + jar.session : cookie;
  return { status: res.status, body: text, cookie: nextCookie };
}

(async () => {
  const first = await request('POST', '/api/auth/signup', {
    name: 'QA',
    email: 'qa-temp-9@example.com',
    password: 'Pass123!',
  });
  console.log('signup', first.status, first.body);

  const cookie = first.cookie;
  const second = await request('POST', '/api/cv', { template: 'modern', title: 'QA CV' }, cookie);
  console.log('create', second.status, second.body);
  const cv = JSON.parse(second.body).cv;

  const patch = await request('PATCH', '/api/cv/' + cv.id, {
    title: 'QA CV',
    template: 'modern',
    personal: {
      fullName: 'QA User',
      title: 'Developer',
      email: 'qa-temp-9@example.com',
      phone: '123',
      location: 'Cameroon',
      linkedin: '',
      portfolio: '',
    },
    summary: 'Strong developer',
    experiences: [
      {
        id: 'exp-1',
        position: 'Developer',
        company: 'Google',
        location: 'Remote',
        startDate: '2023',
        endDate: 'Present',
        current: true,
        description: 'Built things',
      },
    ],
    educations: [
      {
        id: 'edu-1',
        institution: 'School',
        degree: 'BSc',
        field: 'CS',
        startDate: '2018',
        endDate: '2022',
        description: '',
      },
    ],
    skills: [{ id: 'skill-1', name: 'TypeScript', level: 'Advanced' }],
    projects: [],
    certifications: [],
    languages: [{ id: 'lang-1', name: 'English', level: 'Native' }],
  }, cookie);
  console.log('patch', patch.status, patch.body);

  const ex = await request('POST', '/api/cv/' + cv.id + '/export', undefined, cookie);
  console.log('export status', ex.status);
  console.log('export body sample', ex.body.slice(0, 80));
})();
