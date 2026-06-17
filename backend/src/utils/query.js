const toStringId = (value) => (value === undefined || value === null ? value : String(value));

const pickFilters = (query, fields) =>
  fields.reduce((where, field) => {
    if (query[field] !== undefined) {
      where[field] = String(query[field]);
    }
    return where;
  }, {});

const listOptions = (query, allowedSortFields = []) => {
  const options = {};

  if (query._limit) {
    const take = Number(query._limit);
    if (Number.isFinite(take) && take > 0) options.take = take;
  }

  const sortField = query._sort;
  if (sortField && allowedSortFields.includes(sortField)) {
    options.orderBy = { [sortField]: query._order === 'desc' ? 'desc' : 'asc' };
  }

  return options;
};

module.exports = {
  listOptions,
  pickFilters,
  toStringId,
};
