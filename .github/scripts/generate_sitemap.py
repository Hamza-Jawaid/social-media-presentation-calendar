import os
import subprocess
from datetime import datetime, timezone
import xml.etree.ElementTree as ET
from xml.dom import minidom

BASE_URL = "https://hamza-jawaid.github.io/calendar/"

def get_git_modification_time(filepath):
    try:
        # Get the timestamp of the last commit that modified the file
        result = subprocess.run(
            ["git", "log", "-1", "--format=%cI", filepath],
            capture_output=True,
            text=True,
            check=True
        )
        output = result.stdout.strip()
        if output:
            return output
    except subprocess.CalledProcessError:
        pass

    # Fallback to file system modification time if not in git or error
    try:
        mtime = os.path.getmtime(filepath)
        return datetime.fromtimestamp(mtime, tz=timezone.utc).isoformat()
    except OSError:
        return datetime.now(tz=timezone.utc).isoformat()

def main():
    html_files = []
    for root, dirs, files in os.walk("."):
        # Skip hidden directories like .git and .github
        dirs[:] = [d for d in dirs if not d.startswith('.')]
        for file in files:
            if file.endswith(".html"):
                html_files.append(os.path.relpath(os.path.join(root, file), "."))

    # Sort to ensure consistent order (e.g. index.html first)
    html_files.sort(key=lambda x: (x != "index.html", x))

    urlset = ET.Element("urlset", xmlns="http://www.sitemaps.org/schemas/sitemap/0.9")

    for filepath in html_files:
        # Normalize path for URL
        url_path = filepath.replace("\\", "/")
        if url_path == "index.html":
            url_path = "" # Map index.html to the root directory

        full_url = BASE_URL + url_path

        lastmod_time = get_git_modification_time(filepath)

        url_element = ET.SubElement(urlset, "url")
        loc_element = ET.SubElement(url_element, "loc")
        loc_element.text = full_url

        lastmod_element = ET.SubElement(url_element, "lastmod")
        lastmod_element.text = lastmod_time

    # Pretty print XML
    xml_str = ET.tostring(urlset, 'utf-8')
    parsed = minidom.parseString(xml_str)
    pretty_xml_as_string = parsed.toprettyxml(indent="  ")

    # Remove extra empty lines sometimes added by minidom
    lines = [line for line in pretty_xml_as_string.split('\n') if line.strip()]
    final_xml = '\n'.join(lines) + '\n'

    with open("sitemap.xml", "w", encoding="utf-8") as f:
        f.write(final_xml)
    print("sitemap.xml generated successfully.")

if __name__ == "__main__":
    main()
