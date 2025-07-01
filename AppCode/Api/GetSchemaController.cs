using System;
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
      var properties = contentType.Attributes
        .Select(attribute => {
          string typeName = attribute.Type.ToString();
          
          // Determine type using functional transformations
          string schemaType = new[] { "String" }.Contains(typeName) ? "string" :
                             new[] { "Number", "Int", "Integer" }.Contains(typeName) ? "integer" :
                             new[] { "Decimal", "Float", "Double" }.Contains(typeName) ? "number" :
                             new[] { "Boolean" }.Contains(typeName) ? "boolean" :
                             new[] { "Entity", "Object" }.Contains(typeName) ? "object" :
                             new[] { "Array", "List" }.Contains(typeName) ? "array" :
                             "string";  // Default
          
          // Determine format using functional transformations
          string format = new[] { "DateTime" }.Contains(typeName) ? "date-time" :
                         new[] { "Date" }.Contains(typeName) ? "date" :
                         new[] { "Hyperlink", "Url" }.Contains(typeName) ? "uri" :
                         new[] { "Email" }.Contains(typeName) ? "email" :
                         null;  // No format for other types
          
          // Create schema property based on determined type and format
          return string.IsNullOrEmpty(format) 
            ? new SchemaProperty(attribute.Name, schemaType) 
            : new SchemaProperty(attribute.Name, schemaType, format);
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