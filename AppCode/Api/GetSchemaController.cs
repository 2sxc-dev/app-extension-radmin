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
      var properties = contentType.Attributes
        .Select(attribute =>
        {
          // Use the dictionary-based helper methods for type and format
          string schemaType = GetTypeName(attribute);
          string format = GetFormatName(attribute);

          // Create schema property based on determined type and format
          return new SchemaProperty(attribute.Name, schemaType, format);
        })
        .ToDictionary(p => p.Title, p => p);

      var schema = new JsonSchema
      {
        Id = contentType.NameId.ToString(),
        Title = contentType.Name,
        Type = "object",
        Description = contentType.Metadata.Get<string>("Description"),
        Properties = properties,
        Required = contentType.Attributes
          .Where(a => a.IsTitle || a.Metadata.Get<bool>("Required"))
          .Select(a => a.Name)
          .ToList()
      };

      return schema;
    }

    // Updated method signature to match IContentTypeAttribute
    string GetTypeName(IContentTypeAttribute attribute)
    {
      // Use the TypeMappings dictionary to get the type name
      return TypeMappings.TryGetValue(attribute.Type.ToString(), out var typeName)
        ? typeName
        : "string"; // Default to string if type not found
    }

    // Updated method signature to match IContentTypeAttribute
    string GetFormatName(IContentTypeAttribute attribute)
    {
      // Use the FormatMappings dictionary to get the format
      return FormatMappings.TryGetValue(attribute.Type.ToString(), out var formatName)
        ? formatName
        : null; // No format if type not found in mappings
    }

    // Dictionary for type mappings
    static Dictionary<string, string> TypeMappings = new Dictionary<string, string>
    {
      { "String", "string" },
      { "Number", "integer" },
      { "Int", "integer" },
      { "Integer", "integer" },
      { "Decimal", "number" },
      { "Float", "number" },
      { "Double", "number" },
      { "Boolean", "boolean" },
      { "Entity", "object" },
      { "Object", "object" },
      { "Array", "array" },
      { "List", "array" }
    };

    // Dictionary for format mappings
    static Dictionary<string, string> FormatMappings = new Dictionary<string, string>
    {
      { "DateTime", "date-time" },
      { "Date", "date" },
      { "Hyperlink", "uri" },
      { "Url", "uri" },
      { "Email", "email" }
    };
  }
}