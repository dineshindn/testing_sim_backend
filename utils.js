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
      },

      simTransactionsFormSetClause(params, whiteListedColumns) {
        let simSetClause = "";
        let _values = [];
        if (!Object.keys(params).length) return { setClause, values };
      
        const whiteListedParams = Object.keys(params)
          .filter(col => whiteListedColumns.includes(col));
      
        whiteListedParams.forEach((p, i) => {
          simSetClause += (i === whiteListedParams.length - 1) ? ` ${p}` : ` ${p},`;
          _values.push(params[p]);
        });
        return { simSetClause, _values };
      }      
}