const { withGradleProperties } = require("@expo/config-plugins");

module.exports = function withGradlePropertiesModification(config) {
  return withGradleProperties(config, (config) => {
    const properties = config.modResults;

    const setProperty = (key, value) => {
      const existingProperty = properties.find((p) => p.key === key);
      if (existingProperty) {
        existingProperty.value = value;
      } else {
        properties.push({ type: "property", key, value });
      }
    };

    // Increase JVM heap size to 4GB to prevent Out-Of-Memory (OOM) crashes during Gradle builds
    setProperty("org.gradle.jvmargs", "-Xmx4096m -XX:MaxMetaspaceSize=512m");

    return config;
  });
};
