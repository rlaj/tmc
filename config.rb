# Activate and configure extensions
# https://middlemanapp.com/advanced/configuration/#configuring-extensions

activate :autoprefixer do |prefix|
  prefix.browsers = "last 2 versions"
end

# Layouts
# https://middlemanapp.com/basics/layouts/

# Per-page layout changes
page '/*.xml', layout: false
page '/*.json', layout: false
page '/*.txt', layout: false

page 'index.*', layout: 'basic'
page '/en_US/*', layout: 'basic'

activate :bootstrap_navbar



# With alternative layout
# page '/path/to/file.html', layout: 'other_layout'

# Proxy pages
# https://middlemanapp.com/advanced/dynamic-pages/

# proxy(
#   '/this-page-has-no-template.html',
#   '/template-file.html',
#   locals: {
#     which_fake_page: 'Rendering a fake page with a local variable'
#   },
# )

# Helpers
# Methods defined in the helpers block are available in templates
# https://middlemanapp.com/basics/helper-methods/

# helpers do
#   def some_helper
#     'Helping'
#   end
# end

require 'lib/player_helpers.rb'
helpers PlayerHelpers


# Build-specific configuration
# https://middlemanapp.com/advanced/configuration/#environment-specific-settings

# configure :build do
#  ignore "/vendor/font-awesome/less/*.less"
#   activate :minify_css
#   activate :minify_javascript
# end

# after_build do |builder|
#   require 'colorize'
#   require 'fileutils'
#   src_dir = File.join(config[:source], "/vendor/font-awesome/less")
#   dst_dir = File.join(config[:build_dir], "/vendor/font-awesome/less")
#
#   Dir.mkdir(dst_dir) unless File.exists?(dst_dir)
#
#   Dir.glob("#{src_dir}/*.less") do |src|
#     dst = src.gsub(config[:source], config[:build_dir])
#     print '     copying'.green
#     puts "  #{dst}"
#     FileUtils.copy_file(src,dst)
#   end
# end
