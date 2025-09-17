using System.Collections.Generic;
using System.Linq;
using ToSic.Eav.Data;
using System.Web;

namespace AppCode.System.Radmin.Api
{
  public class RadminSchemaHelper
  {
    public JsonSchema ConvertToJsonSchema(IContentType contentType)
    {
      var portalCulture = HttpContext.Current.Items["PortalSettings"]
        .GetType()
        .GetProperty("CultureCode")
        .GetValue(HttpContext.Current.Items["PortalSettings"], null)?
        .ToString()
        .ToLower();

      var properties = contentType.Attributes
        .Select(attribute =>
        {
          string schemaType = GetTypeName(attribute);
          string format = GetFormatName(attribute);
          string title = attribute.Metadata
            .OfType("@All")
            .FirstOrDefault()?
            .Get<string>("Name", language: portalCulture);

        // Create schema property based on determined type and format
          return new SchemaProperty(attribute.Name, title, schemaType, format);
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
    private string GetTypeName(IContentTypeAttribute attribute)
    {
      // Use the TypeMappings dictionary to get the type name
      return TypeMappings.TryGetValue(attribute.Type.ToString(), out var typeName)
        ? typeName
        : "string"; // Default to string if type not found
    }

    // Updated method signature to match IContentTypeAttribute
    private string GetFormatName(IContentTypeAttribute attribute)
    {
      // Use the FormatMappings dictionary to get the format
      return FormatMappings.TryGetValue(attribute.Type.ToString(), out var formatName)
        ? formatName
        : null; // No format if type not found in mappings
    }

    // Dictionary for type mappings
    private static Dictionary<string, string> TypeMappings = new Dictionary<string, string>
    {
      { "String", "string" },
      { "Number", "number" },
      { "Int", "number" },
      { "number", "number" },
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
    private static Dictionary<string, string> FormatMappings = new Dictionary<string, string>
    {
      { "DateTime", "date-time" },
      { "Date", "date" },
      { "Hyperlink", "uri" },
      { "Url", "uri" },
      { "Email", "email" }
    };
  }
}