from setuptools import setup, find_packages

version = '1.0.0'

setup(
    name='ckanext-bmkg',
    version=version,
    description="Custom Theme, Metadata Schema, and Geospatial Integration for BMKG Open Data Portal",
    long_description="""\
    Ekstensi resmi CKAN untuk Portal Data Terbuka Badan Meteorologi, Klimatologi, dan Geofisika (BMKG).
    Menyediakan tema visual Portal Data, skema metadata 4 pilar MKG, dan pratinjau data interaktif.
    """,
    classifiers=[
        'Development Status :: 4 - Beta',
        'Framework :: CKAN',
        'Programming Language :: Python :: 3.10',
    ],
    keywords='CKAN BMKG Open Data Meteorologi Klimatologi Geofisika',
    author='Tim Portal Data BMKG',
    author_email='portaldata@bmkg.go.id',
    url='https://github.com/bmkg/ckanext-bmkg',
    license='GPL-3.0',
    packages=find_packages(exclude=['ez_setup', 'examples', 'tests']),
    namespace_packages=['ckanext'],
    include_package_data=True,
    zip_safe=False,
    install_requires=[
        # ckanext-bmkg dependensi didefinisikan di sini
    ],
    entry_points="""
    [ckan.plugins]
    bmkg=ckanext.bmkg.plugin:BMKGThemePlugin
    bmkg_theme=ckanext.bmkg.plugin:BMKGThemePlugin
    bmkg_schema=ckanext.bmkg.plugin:BMKGSchemaPlugin
    """,
)
