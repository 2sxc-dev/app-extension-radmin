using System;
using System.Collections.Generic;
using System.Linq;
using System.Web.Http;
using ToSic.Eav.Data;

namespace AppCode.Api
{
  [AllowAnonymous]
  public class GetSchemaController : Custom.Hybrid.ApiTyped
  {
    [HttpGet]
    public object GetContentType(String typename)
    {
      /// <summary>
      /// Get the raw content type for the given typename as JSON
      /// </summary>
      return App.Data.GetContentType(typename);
    }

    [HttpGet]
    public object GetSchema(String typename)
    {
      /// <summary>
      /// Get the schema for the given typename in JSON Schema format
      /// </summary>
      var contentType = App.Data.GetContentType(typename);
      return ConvertToJsonSchema(contentType);
    }

    private object ConvertToJsonSchema(IContentType contentType)
    {
      var properties = contentType.Attributes.Select(attribute =>
      {
        string typeName = attribute.Type.ToString();
        switch (typeName)
        {
          case "String":
            return new SchemaProperty(attribute.Name, "string");
          case "Number":
          case "Int":
          case "Integer":
            return new SchemaProperty(attribute.Name, "integer");
          case "Decimal":
          case "Float":
          case "Double":
            return new SchemaProperty(attribute.Name, "number");
          case "Boolean":
            return new SchemaProperty(attribute.Name, "boolean");
          case "DateTime":
            return new SchemaProperty(attribute.Name, "string", "date-time");
          case "Date":
            return new SchemaProperty(attribute.Name, "string", "date");
          case "Hyperlink":
          case "Url":
            return new SchemaProperty(attribute.Name, "string", "uri");
          case "Email":
            return new SchemaProperty(attribute.Name, "string", "email");
          case "Entity":
          case "Object":
            return new SchemaProperty(attribute.Name, "object");
          case "Array":
          case "List":
            return new SchemaProperty(attribute.Name, "array");
          default:
            return new SchemaProperty(attribute.Name, "string");
        }
      });

      var schema = new JsonSchema
      {
        Id = contentType.NameId.ToString(),
        Title = contentType.Name,
        Type = "object",
        Description = "",
        Properties = properties.ToDictionary(p => p.Title, p => p),
        Required = contentType.Attributes
          .Where(a => a.IsTitle)
          .Select(a => a.Name)
          .ToList()
          // TODO: There is no IsRequired, so only the title is required (wip)
      };

      return schema;
    }
  }
}
