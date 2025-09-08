using System.Web.Http;
using AppCode.System.SxcTables.Data;
using System;

namespace AppCode.System.SxcTables.Api
{
  [AllowAnonymous]
  public class TableConfigController : Custom.Hybrid.ApiTyped
  {
    [HttpGet]
    public RadminTable GetData(Guid viewId)
    {
      /// <summary>
      /// Get the RadminTable for the given Guid
      /// </summary>
      return App.Data.GetOne<RadminTable>(viewId);
    }
  }
}