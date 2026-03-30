import { useCallback, useEffect, useState } from 'react';
import initSqlJs from 'sql.js';
import { SEED_SQL } from '../data/seed.js';

export function useDatabase() {
  const [db, setDb] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    let database = null;

    initSqlJs({ locateFile: () => '/sql-wasm.wasm' })
      .then((SQL) => {
        if (!active) {
          return;
        }

        database = new SQL.Database();
        database.run(SEED_SQL);
        setDb(database);
        setLoading(false);
      })
      .catch((err) => {
        if (!active) {
          return;
        }

        setError(err.message);
        setLoading(false);
      });

    return () => {
      active = false;
      if (database) {
        database.close();
      }
    };
  }, []);

  const runQuery = useCallback((sql) => {
    if (!db) {
      return { error: 'Database not ready yet.' };
    }

    try {
      const queryResults = db.exec(sql);

      if (!queryResults.length) {
        return { columns: [], rows: [], empty: true };
      }

      return {
        columns: queryResults[0].columns,
        rows: queryResults[0].values,
      };
    } catch (queryError) {
      return { error: queryError.message };
    }
  }, [db]);

  return { db, error, loading, runQuery };
}
