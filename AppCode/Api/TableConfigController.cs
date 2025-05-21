using System.Web.Http;
using AppCode.Data;
using System;

namespace AppCode.Api
{
  [AllowAnonymous]
  public class TableConfigController : Custom.Hybrid.ApiTyped
  {
    [HttpGet]
    public DataViewTableConfig GetData(Guid viewId)
    {
      /// <summary>
      /// Get the DataViewTableConfig for the given Guid
      /// </summary>
      return App.Data.GetOne<DataViewTableConfig>(viewId);
    }
  }
}