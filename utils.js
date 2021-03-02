module.exports = {
     formSetClause(params, whiteListedColumns) {
        var setClause = "";
        var values = [];
        if (!Object.keys(params).length) return { setClause, values };
      
        setClause = " SET ";
        const whiteListedParams = Object.keys(params)
          .filter(col => whiteListedColumns.includes(col));
      
        whiteListedParams.forEach((p, i) => {
          setClause += (i === whiteListedParams.length - 1) ? ` ${p}=?` : ` ${p}=?,`;
          values.push(params[p]);
        });
        return { setClause, values };
      }
}