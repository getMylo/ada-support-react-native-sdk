def use_ada! (options={})
  # The prefix to react-native
  prefix = options[:path] ||= "../node_modules/"

  # The Pods which should be included in all projects
  pod 'react-native-blob-util', :path => "#{prefix}/react-native-blob-util"
end