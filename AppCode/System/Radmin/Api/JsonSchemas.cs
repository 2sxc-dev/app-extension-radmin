using System.Collections.Generic;
using System.Text.Json.Serialization;

namespace AppCode.System.Radmin.Api
{
  public class JsonSchema
  {
    [JsonPropertyName("$schema")]
    public string Schema { get; set; } = "https://json-schema.org/draft/2020-12/schema";
    [JsonPropertyName("$id")]
    public string Id { get; set; }
    public string Title { get; set; }
    public string Description { get; set; }
    public string Type { get; set; }
    public Dictionary<string, SchemaProperty> Properties { get; set; }
    public List<string> Required { get; set; }
  }
  
  public class SchemaProperty
  {
    public SchemaProperty(string title, string type, string format = null, string description = null)
    {
      Title = title;
      Type = type;
      Format = format;
      Description = description;
    }
    public string Title { get; set; }
    public string Type { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public string Format { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public Dictionary<string, object> Items { get; set; }
    [JsonIgnore(Condition = JsonIgnoreCondition.WhenWritingDefault)]
    public string Description { get; set; }
  }
}
