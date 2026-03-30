import { useMemo, useState } from 'react';

const TABLES = [
  ['crime_scene_report', ['date', 'type', 'description', 'city']],
  ['person', ['id', 'name', 'license_id', 'address_number', 'address_street_name', 'ssn']],
  ['drivers_license', ['id', 'age', 'height', 'eye_color', 'hair_color', 'gender', 'plate_number', 'car_make', 'car_model']],
  ['interview', ['person_id', 'transcript']],
  ['get_fit_now_member', ['id', 'person_id', 'name', 'membership_start_date', 'membership_status']],
  ['get_fit_now_check_in', ['membership_id', 'check_in_date', 'check_in_time', 'check_out_time']],
  ['facebook_event_checkin', ['person_id', 'event_id', 'event_name', 'date']],
  ['income', ['ssn', 'annual_income']],
];

export default function SchemaPanel({ onTableClick }) {
  const [filter, setFilter] = useState('');
  const [openTable, setOpenTable] = useState('crime_scene_report');

  const filteredTables = useMemo(() => {
    return TABLES.filter(([name]) => name.toLowerCase().includes(filter.toLowerCase()));
  }, [filter]);

  return (
    <section className="sidebar-section">
      <div className="sidebar-header">
        <div>
          <strong>Tables</strong>
          <span>Click a table to preview it instantly.</span>
        </div>
        <input
          className="sidebar-filter"
          onChange={(event) => setFilter(event.target.value)}
          placeholder="Filter tables"
          type="search"
          value={filter}
        />
      </div>

      <div className="schema-list">
        {filteredTables.map(([name, columns]) => {
          const expanded = openTable === name;
          return (
            <article className={`schema-item ${expanded ? 'is-open' : ''}`} key={name}>
              <div className="schema-trigger">
                <button className="schema-name" onClick={() => onTableClick(name)} type="button">
                  {name}
                </button>
                <button
                  className="schema-toggle"
                  onClick={() => setOpenTable((current) => (current === name ? '' : name))}
                  type="button"
                >
                  {expanded ? '−' : '+'}
                </button>
              </div>

              {expanded && (
                <div className="schema-columns">
                  {columns.map((column) => (
                    <span key={column}>{column}</span>
                  ))}
                </div>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}
