using System;
using System.Collections.Generic;
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
      // Create the base schema object
      var schema = new Dictionary<string, object>
      {
        ["$schema"] = "http://json-schema.org/draft-07/schema#",
        ["description"] = $"Schema for {contentType.Name} content type",
        ["title"] = contentType.Name,
        ["type"] = "object",
        ["properties"] = new Dictionary<string, object>(),
        ["required"] = new List<string>()
      };

      // Process each attribute
      var properties = (Dictionary<string, object>)schema["properties"];
      var required = (List<string>)schema["required"];

      foreach (var attribute in contentType.Attributes)
      {
        var property = new Dictionary<string, object>
        {
          ["title"] = attribute.Name,
          ["description"] = $"{attribute.Name} field"
        };

        // Map the type
        string typeName = attribute.Type.ToString();
        switch (typeName)
        {
          case "String":
            property["type"] = "string";
            break;
          case "Number":
          case "Int":
          case "Integer":
            property["type"] = "integer";
            break;
          case "Decimal":
          case "Float":
          case "Double":
            property["type"] = "number";
            break;
          case "Boolean":
            property["type"] = "boolean";
            break;
          case "DateTime":
            property["type"] = "string";
            property["format"] = "date-time";
            break;
          case "Date":
            property["type"] = "string";
            property["format"] = "date";
            break;
          case "Hyperlink":
          case "Url":
            property["type"] = "string";
            property["format"] = "uri";
            break;
          case "Email":
            property["type"] = "string";
            property["format"] = "email";
            break;
          case "Entity":
          case "Object":
            property["type"] = "object";
            break;
          case "Array":
          case "List":
            property["type"] = "array";
            property["items"] = new Dictionary<string, object>
            {
              ["type"] = "string"
            };
            break;
          default:
            property["type"] = "string";
            break;
        }

        // Add to properties
        properties[attribute.Name] = property;

        // If this is a required field, add to required array
        if (attribute.IsTitle)
        {
          required.Add(attribute.Name);
        }
      }

      return schema;
    }
  }
}