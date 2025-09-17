using System.Collections.Generic;
using System.Linq;
using ToSic.Eav.Data;

namespace AppCode.System.Radmin.Api
{
  public class RadminSchemaHelper
  {
    public JsonSchema ConvertToJsonSchema(IContentType contentType)
    {
      var properties = contentType.Attributes
        .Select(attribute =>
        {
          // Use the dictionary-based helper methods for type and format
          string schemaType = GetTypeName(attribute);
          string format = GetFormatName(attribute);

          var name = attribute.Name;
          var title = attribute.Metadata.Get<string>("Name") ?? name;

          // Get the main block of metadata for a field (content type is "@All")
          var mainMetadata = attribute.Metadata.OfType("@All").FirstOrDefault();
          if (mainMetadata != null) {
            // get current thread culture
            var currentCulture = global::System.Threading.Thread.CurrentThread.CurrentCulture.Name;
            title = mainMetadata.Get<string>("Name", languages: new string[] { currentCulture, "en-us", null }) ?? title;
          }

          // Create schema property based on determined type and format
          return new SchemaProperty(name, title, schemaType, format);
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