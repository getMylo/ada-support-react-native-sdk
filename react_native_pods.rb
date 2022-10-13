def use_ada! (options={})
  # The prefix to react-native
  prefix = options[:path] ||= "../node_modules/"

  # The Pods which should be included in all projects
  pod 'rn-fetch-blob', :path => "#{prefix}/rn-fetch-blob"
end