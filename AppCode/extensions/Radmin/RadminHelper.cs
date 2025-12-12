using System;
using System.Linq;
using AppCode.Extensions.Radmin.Data;
using Custom.Hybrid;

namespace AppCode.Extensions.Radmin
{
  public class RadminHelper: CodeTyped
  {
    /// <summary>
    /// Get the resources
    /// </summary>
    /// <returns></returns>
    public RadminResources GetResources()
    {
      var resources = App.Data.GetStream(nameof(RadminResources)).ToList();
  
      switch (resources.Count) {
        case 0:
          throw new Exception("Radmin Resources definition is missing - please create one in the Radmin app.");
        case 1:
          // Only one resource - all good
          return As<RadminResources>(resources[0]);
        default:
          // Multiple resources found - use the first one but log a warning
          var resCustomized = resources.Last();
          return AsStack<RadminResources>(resCustomized, resources[0]);
      }

    }
  }
}