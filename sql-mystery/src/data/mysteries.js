export const MYSTERIES = {
  easy: {
    id: 'easy',
    label: 'Easy',
    description: 'Training wheels for first-time detectives.',
    timeLimit: 600,
    hintCount: 6,
    hideSchema: false,
    starterQuery: "SELECT * FROM crime_scene_report\nWHERE type = 'murder'\n  AND city = 'SQL City';",
    hints: [
      'Run the starter query to read the crime scene report. It mentions 2 witnesses.',
      "Find witness 1: SELECT * FROM person WHERE address_street_name = 'Northwestern Dr' ORDER BY address_number DESC LIMIT 1;",
      "Find witness 2: SELECT * FROM person WHERE address_street_name = 'Franklin Ave' AND address_number = 103;",
      'Read both interviews: SELECT * FROM interview WHERE person_id IN (10001, 10002);',
      "Check the gym: SELECT m.*, c.* FROM get_fit_now_member m JOIN get_fit_now_check_in c ON m.id = c.membership_id WHERE m.membership_status = 'gold' AND c.check_in_date = 20180109 AND m.id LIKE '48Z%';",
      "Match the plate: SELECT p.name FROM person p JOIN drivers_license d ON p.license_id = d.id WHERE d.plate_number LIKE '%H42W%';",
    ],
    solution: {
      killer: 'Jeremy Bowers',
      mastermind: 'Miranda Priestly',
    },
  },
  medium: {
    id: 'medium',
    label: 'Medium',
    description: 'A tighter clock with fewer breadcrumbs.',
    timeLimit: 420,
    hintCount: 3,
    hideSchema: false,
    starterQuery: '',
    hints: [
      'Two witnesses saw the killer. One lived at the last house on Northwestern Dr, the other on Franklin Ave. Read the crime scene report first.',
      "The witnesses describe a gold gym member with a bag starting '48Z' who was there on Jan 9. The plate contained 'H42W'.",
      'JOIN get_fit_now_member with get_fit_now_check_in and then with person and drivers_license to find the match.',
    ],
    solution: {
      killer: 'Jeremy Bowers',
      mastermind: 'Miranda Priestly',
    },
  },
  hard: {
    id: 'hard',
    label: 'Hard',
    description: 'Minimal help, hidden schema, no mercy.',
    timeLimit: 240,
    hintCount: 1,
    hideSchema: true,
    starterQuery: '',
    hints: [
      'Read the crime_scene_report for a murder in SQL City on 20180115. Everything you need is in the database.',
    ],
    solution: {
      killer: 'Jeremy Bowers',
      mastermind: 'Miranda Priestly',
    },
  },
};
