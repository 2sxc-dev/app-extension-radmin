using System;
using System.Web.Http;
using AppCode.Extensions.Radmin.Data;
using DotNetNuke.Security;
using DotNetNuke.Web.Api;

namespace AppCode.Extensions.Radmin.Api
{
  // Requires edit rights to access - edit on the admin-pages
  [DnnModuleAuthorize(AccessLevel = SecurityAccessLevel.Edit)]
  public class RadminController : Custom.Hybrid.ApiTyped
  {
    /// <summary>
    /// Get the schema for the given typename in JSON Schema format
    /// </summary>
    /// <param name="typename"></param>
    /// <returns></returns>
    [HttpGet]
    public JsonSchema Schema(string typename)
    {
      /// <summary>
      /// Get the schema for the given typename in JSON Schema format
      /// </summary>
      var contentType = App.Data.GetContentType(typename);
      var helper = new RadminSchemaHelper();
      return helper.ConvertToJsonSchema(contentType);
    }

    [HttpGet]
    public RadminTable Table(Guid viewId)
    {
      /// <summary>
      /// Get the RadminTable for the given Guid
      /// </summary>
      return App.Data.GetOne<RadminTable>(viewId);
    }
  }
}