using System.Web.Http;
using AppCode.Data;
using System;

namespace AppCode.Api
{
  [AllowAnonymous]
  public class GetSchemaController : Custom.Hybrid.ApiTyped
  {
    [HttpGet]
    public object GetSchema(String typename)
    {
      /// <summary>
      /// Return metadata for typename
      /// </summary>
      return App.Data.GetContentType(typename);
    }
  }
}