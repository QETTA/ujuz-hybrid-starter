const { withProjectBuildGradle } = require('expo/config-plugins');

/**
 * Expo config plugin: adds Naver Map Maven repository to android/build.gradle
 * Required for com.naver.maps:map-sdk resolution
 */
module.exports = function withNaverMaven(config) {
  return withProjectBuildGradle(config, (config) => {
    const contents = config.modResults.contents;
    const naverRepo = "maven { url 'https://repository.map.naver.com/archive/maven' }";

    if (!contents.includes('repository.map.naver.com')) {
      config.modResults.contents = contents.replace(
        "maven { url 'https://www.jitpack.io' }",
        `${naverRepo}\n    maven { url 'https://www.jitpack.io' }`
      );
    }

    return config;
  });
};
